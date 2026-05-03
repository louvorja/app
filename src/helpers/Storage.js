/**
 * Storage.js — Abstração de armazenamento para o LouvorJA.
 *
 * Suporta dois modos de operação:
 *
 * 1. Web/PWA:
 *    - type="local"   → localStorage (comportamento original, inalterado)
 *    - type="session" → sessionStorage (comportamento original, inalterado)
 *
 * 2. Desktop (Electron):
 *    - type="local"   → cache em memória (_desktopCache) sincronizado com
 *                       arquivos JSON em userData/storage/ via IPC assíncrono.
 *                       As assinaturas dos métodos permanecem síncronas graças
 *                       ao cache em memória que é hidratado ANTES do app montar.
 *    - type="session" → sessionStorage (igual ao web — sessão não precisa persistir)
 *
 * ATENÇÃO: NÃO alterar as assinaturas de set/get/remove/removeAll.
 * UserData.js e Database.js dependem das assinaturas síncronas atuais.
 *
 * Fase D1 — Storage persistente via userStore IPC.
 */

import Platform from "@/helpers/Platform";

const _devLog = (...args) => {
  if (import.meta.env.DEV) console.log(...args);
};

// ---------------------------------------------------------------------------
// Cache em memória para modo desktop
// ---------------------------------------------------------------------------

/** @type {Record<string, any>} Cache em memória das chaves "local" no Electron */
let _desktopCache = {};

/** true quando a hidratação inicial foi concluída */
let _desktopHydrated = false;

/** Promise da hidratação (singleton — evita múltiplas hidratações paralelas) */
let _hydrationPromise = null;

function assertHydrated(op) {
  if (Platform.isDesktop && !_desktopHydrated) {
    throw new Error(
      `[Storage] ${op}() chamado antes de Storage.hydrate() — aguarde a hidratação antes de montar o app.`
    );
  }
}

// ---------------------------------------------------------------------------
// Migração de localStorage → userStore
// ---------------------------------------------------------------------------

/**
 * Na primeira vez que o Electron abre (userStore vazio), copia os dados do
 * localStorage para o userStore. Isso preserva as preferências do usuário que
 * usou o PWA antes de instalar o desktop.
 *
 * Não deleta o localStorage — mantém compatibilidade com o PWA.
 */
async function migrateFromLocalStorage() {
  if (!Platform.isDesktop) return;

  try {
    const existingKeys = await Platform.userStore.keys();
    if (existingKeys.length > 0) return; // já migrado

    const count = localStorage.length;
    if (count === 0) return;

    _devLog(`[Storage] Migrando ${count} chaves do localStorage para userStore...`);

    const writes = [];
    for (let i = 0; i < count; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      let value;
      try {
        value = JSON.parse(localStorage.getItem(key));
      } catch {
        value = localStorage.getItem(key);
      }

      writes.push(Platform.userStore.write(key, value));
      _desktopCache[key] = value;
    }

    await Promise.all(writes);
    _devLog(`[Storage] Migração concluída: ${writes.length} chaves copiadas.`);
  } catch (e) {
    console.warn("[Storage] Falha na migração do localStorage:", e);
  }
}

// ---------------------------------------------------------------------------
// Hidratação
// ---------------------------------------------------------------------------

/**
 * Carrega todas as chaves do userStore para o cache em memória.
 * Deve ser chamado ANTES de montar o app no Electron.
 * No web/PWA é no-op.
 *
 * @returns {Promise<void>}
 */
async function hydrate() {
  if (_desktopHydrated) return;

  if (!Platform.isDesktop) {
    _desktopHydrated = true;
    return;
  }

  if (!_hydrationPromise) {
    _hydrationPromise = (async () => {
      try {
        // Migrar do localStorage na primeira vez (se userStore vazio)
        await migrateFromLocalStorage();

        // Carregar todas as chaves do userStore para o cache em memória
        const storedKeys = await Platform.userStore.keys();

        await Promise.all(
          storedKeys.map(async (k) => {
            try {
              const value = await Platform.userStore.read(k);
              if (value !== null) _desktopCache[k] = value;
            } catch (e) {
              console.warn(`[Storage] Falha ao ler chave "${k}" do userStore:`, e);
            }
          })
        );

        // Logar caminho do storage para facilitar debug
        try {
          const storageDir = await Platform.userStore.dir();
          _devLog(`[Storage] Diretório de storage: ${storageDir}`);
        } catch (_) {
          /* ignorar */
        }
      } catch (e) {
        console.warn("[Storage] Falha na hidratação do userStore:", e);
      }

      _desktopHydrated = true;
    })();
  }

  await _hydrationPromise;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export default {
  /**
   * Armazena um valor.
   *
   * @param {string} item  Chave
   * @param {any}    data  Valor (objetos são serializados em JSON)
   * @param {"local"|"session"} type  Tipo de storage
   */
  set(item, data, type = "local") {
    // Sessão: sempre usa sessionStorage (mesmo no Electron)
    if (type === "session") {
      const serialized = typeof data === "object" ? JSON.stringify(data) : data;
      sessionStorage.setItem(item, serialized);
      return;
    }

    // Desktop: cache em memória + escrita assíncrona no userStore
    if (Platform.isDesktop) {
      assertHydrated("set");
      _desktopCache[item] = data;
      Platform.userStore
        .write(item, data)
        .catch((e) => console.warn(`[Storage] set("${item}") IPC falhou:`, e));
      return;
    }

    // Web: localStorage normal
    if (typeof data === "object") data = JSON.stringify(data);
    localStorage.setItem(item, data);
  },

  /**
   * Recupera um valor armazenado.
   *
   * @param {string} item     Chave
   * @param {any}    ifnull   Valor padrão se não encontrado
   * @param {"local"|"session"} type  Tipo de storage
   * @returns {any}
   */
  get(item, ifnull = null, type = "local") {
    // Sessão: sempre usa sessionStorage (mesmo no Electron)
    if (type === "session") {
      let data = sessionStorage.getItem(item);
      if (!data) return ifnull;

      if (ifnull === null) {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      } else if (typeof ifnull === "object") {
        return JSON.parse(data);
      } else {
        return data;
      }
    }

    // Desktop: lê do cache em memória (populado pela hidratação)
    if (Platform.isDesktop) {
      assertHydrated("get");
      const value = _desktopCache[item];
      if (value === undefined || value === null) return ifnull;
      return value;
    }

    // Web: localStorage normal (código original)
    let data = localStorage.getItem(item);
    if (!data) return ifnull;

    if (ifnull === null) {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = data;
      }
      return parsed;
    } else if (typeof ifnull === "object") {
      return JSON.parse(data);
    } else {
      return data;
    }
  },

  /**
   * Remove uma chave do storage.
   *
   * @param {string} item
   * @param {"local"|"session"} type
   */
  remove(item, type = "local") {
    if (type === "session") {
      sessionStorage.removeItem(item);
      return;
    }

    if (Platform.isDesktop) {
      delete _desktopCache[item];
      Platform.userStore
        .remove(item)
        .catch((e) => console.warn(`[Storage] remove("${item}") IPC falhou:`, e));
      return;
    }

    localStorage.removeItem(item);
  },

  /**
   * Remove todas as chaves cujo prefixo (antes de ":") corresponda ao item.
   * Ex: removeAll("db") remove "db:pt_musics", "db:bible_pt", etc.
   *
   * @param {string} item    Prefixo
   * @param {"local"|"session"} type
   */
  removeAll(item, type = "local") {
    if (type === "session") {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.split(":")[0] === item) {
          sessionStorage.removeItem(key);
        }
      }
      return;
    }

    if (Platform.isDesktop) {
      const keysToRemove = Object.keys(_desktopCache).filter((k) => k.split(":")[0] === item);
      keysToRemove.forEach((k) => {
        delete _desktopCache[k];
        Platform.userStore
          .remove(k)
          .catch((e) => console.warn(`[Storage] removeAll remove("${k}") IPC falhou:`, e));
      });
      return;
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.split(":")[0] === item) {
        localStorage.removeItem(key);
      }
    }
  },

  /**
   * Retorna o objeto de storage nativo para o tipo dado.
   * Mantido para compatibilidade retroativa.
   *
   * @param {"local"|"session"} type
   * @returns {Storage}
   */
  storage(type = "local") {
    if (type === "session") return sessionStorage;
    return localStorage;
  },

  /**
   * Hidratação assíncrona — deve ser chamado antes de montar o app.
   * No-op no web/PWA.
   *
   * @returns {Promise<void>}
   */
  hydrate,
};
