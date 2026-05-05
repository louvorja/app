/**
 * Storage.ts — Adapter de persistência para o LouvorJA.
 *
 * Responsabilidade: único ponto de leitura/escrita em localStorage (web) ou
 * userData via IPC (Electron). Não contém lógica de negócio.
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
 * Callers autorizados:
 *   - UserData.ts    — persiste preferências do usuário em "local"
 *   - Database.ts    — usa "session" para cache de JSONs do banco (sem lógica de negócio)
 *   - main.js        — chama hydrate() antes de montar o app
 *
 * Componentes e módulos NÃO devem importar Storage diretamente.
 * Use UserData.ts para preferências persistidas ou AppData.ts para estado volátil.
 *
 * ATENÇÃO: NÃO alterar as assinaturas de set/get/remove/removeAll.
 * UserData.ts e Database.ts dependem das assinaturas síncronas atuais.
 *
 * Fase D1 — Storage persistente via userStore IPC.
 * @category helper-puro — Seguro no Electron main process; sem APIs Vue.
 */

import Platform from "@/helpers/Platform";

export type StorageType = "local" | "session";

const _devLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) console.log(...args);
};

// ---------------------------------------------------------------------------
// Cache em memória para modo desktop
// ---------------------------------------------------------------------------

let _desktopCache: Record<string, unknown> = {};
let _desktopHydrated = false;
let _hydrationPromise: Promise<void> | null = null;

function assertHydrated(op: string): void {
  if (Platform.isDesktop && !_desktopHydrated) {
    throw new Error(
      `[Storage] ${op}() chamado antes de Storage.hydrate() — aguarde a hidratação antes de montar o app.`
    );
  }
}

// ---------------------------------------------------------------------------
// Migração de localStorage → userStore
// ---------------------------------------------------------------------------

async function migrateFromLocalStorage(): Promise<void> {
  if (!Platform.isDesktop) return;
  if (!Platform.userStore) return;

  try {
    const existingKeys: string[] = await Platform.userStore.keys();
    if (existingKeys.length > 0) return;

    const count = localStorage.length;
    if (count === 0) return;

    _devLog(`[Storage] Migrando ${count} chaves do localStorage para userStore...`);

    const writes: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      let value: unknown;
      try {
        value = JSON.parse(localStorage.getItem(key)!);
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

async function hydrate(): Promise<void> {
  if (_desktopHydrated) return;

  if (!Platform.isDesktop) {
    _desktopHydrated = true;
    return;
  }

  if (!Platform.userStore) {
    _desktopHydrated = true;
    return;
  }

  const _userStore = Platform.userStore;

  if (!_hydrationPromise) {
    _hydrationPromise = (async () => {
      try {
        await migrateFromLocalStorage();

        const storedKeys: string[] = await _userStore.keys();

        await Promise.all(
          storedKeys.map(async (k: string) => {
            try {
              const value: unknown = await _userStore.read(k);
              if (value !== null) _desktopCache[k] = value;
            } catch (e) {
              console.warn(`[Storage] Falha ao ler chave "${k}" do userStore:`, e);
            }
          })
        );

        try {
          const storageDir: string = await _userStore.dir();
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
   * @param item  Chave
   * @param data  Valor (objetos são serializados em JSON)
   * @param type  Tipo de storage
   */
  set(item: string, data: unknown, type: StorageType = "local"): void {
    if (type === "session") {
      const serialized = typeof data === "object" ? JSON.stringify(data) : String(data);
      sessionStorage.setItem(item, serialized);
      return;
    }

    if (Platform.isDesktop) {
      assertHydrated("set");
      _desktopCache[item] = data;
      Platform.userStore?.write(item, data)
        .catch((e: unknown) => console.warn(`[Storage] set("${item}") IPC falhou:`, e));
      return;
    }

    const serialized = typeof data === "object" ? JSON.stringify(data) : String(data);
    localStorage.setItem(item, serialized);
  },

  /**
   * Recupera um valor armazenado.
   *
   * @param item     Chave
   * @param ifnull   Valor padrão se não encontrado
   * @param type     Tipo de storage
   */
  get<T = unknown>(item: string, ifnull: T | null = null, type: StorageType = "local"): T | null {
    if (type === "session") {
      const data = sessionStorage.getItem(item);
      if (!data) return ifnull;

      if (ifnull === null) {
        try {
          return JSON.parse(data) as T;
        } catch {
          return data as unknown as T;
        }
      } else if (typeof ifnull === "object") {
        return JSON.parse(data) as T;
      } else {
        return data as unknown as T;
      }
    }

    if (Platform.isDesktop) {
      assertHydrated("get");
      const value = _desktopCache[item];
      if (value === undefined || value === null) return ifnull;
      return value as T;
    }

    const data = localStorage.getItem(item);
    if (!data) return ifnull;

    if (ifnull === null) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = data;
      }
      return parsed as T;
    } else if (typeof ifnull === "object") {
      return JSON.parse(data) as T;
    } else {
      return data as unknown as T;
    }
  },

  /**
   * Remove uma chave do storage.
   *
   * @param item
   * @param type
   */
  remove(item: string, type: StorageType = "local"): void {
    if (type === "session") {
      sessionStorage.removeItem(item);
      return;
    }

    if (Platform.isDesktop) {
      delete _desktopCache[item];
      Platform.userStore?.remove(item)
        .catch((e: unknown) => console.warn(`[Storage] remove("${item}") IPC falhou:`, e));
      return;
    }

    localStorage.removeItem(item);
  },

  /**
   * Remove todas as chaves cujo prefixo (antes de ":") corresponda ao item.
   * Ex: removeAll("db") remove "db:pt_musics", "db:bible_pt", etc.
   *
   * @param item    Prefixo
   * @param type
   */
  removeAll(item: string, type: StorageType = "local"): void {
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
        Platform.userStore?.remove(k)
          .catch((e: unknown) =>
            console.warn(`[Storage] removeAll remove("${k}") IPC falhou:`, e)
          );
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
   * @param type
   */
  storage(type: StorageType = "local"): globalThis.Storage {
    if (type === "session") return sessionStorage;
    return localStorage;
  },

  /**
   * Hidratação assíncrona — deve ser chamado antes de montar o app.
   * No-op no web/PWA.
   */
  hydrate,
};
