/**
 * appStore.js — Estado volátil de sessão do LouvorJA (Pinia).
 *
 * Substitui src/store/ (Vuex). Contém toda a state de sessão exceto
 * preferências do usuário (user_data), que vivem em userDataStore.js.
 *
 * Callers autorizados: AppData.js (via helper), Alert.js.
 * Componentes e módulos NÃO importam esta store diretamente —
 * usam AppData.get/set ou composables.
 */

import { defineStore } from "pinia";

// Percorre `obj` via notação de ponto e atribui `value` na folha.
function _walkSet(obj, path, value) {
  if (!path) return;
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

// Lê `obj` via notação de ponto. Retorna undefined se o path não existir.
function _walkGet(obj, path) {
  if (!path) return obj;
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result == null) return undefined;
    result = result[key];
  }
  return result;
}

// Verifica se um path existe em `obj` sem lançar erro.
function _walkExists(obj, path) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  return current[keys[keys.length - 1]] !== undefined;
}

export const useAppStore = defineStore("app", {
  state: () => ({
    /** @type {boolean} Modo de desenvolvimento ativo */
    is_dev: false,
    /** @type {boolean} Tema escuro ativo */
    is_dark: false,
    /** @type {boolean} App rodando em janela popup (Popup.vue) */
    is_popup: false,
    /** @type {boolean} Viewport mobile detectado */
    is_mobile: false,
    /** @type {boolean} App rodando no Electron (desktop) */
    is_desktop: false,
    /** @type {boolean} Conexão com internet disponível */
    is_online: false,
    /** @type {Window|null} Referência à janela popup aberta; null quando fechada */
    popup: null,
    /** @type {string|null} ID do módulo exibido em popup */
    popup_module: null,
    /** @type {boolean} Sinaliza que ModuleManager.init() concluiu — libera Modules.vue */
    import_modules: false,
    /** @type {boolean} Loader global visível */
    loading: false,
    /** @type {Record<string, object>} Estado runtime de cada módulo, indexado por ID */
    modules: {},
    /**
     * Agrupamento de módulos por categoria para o menu lateral.
     * Inicia vazio — populado inteiramente por ModuleManager.init() a partir
     * dos campos `category` nos manifests. Não declare grupos hardcoded aqui.
     * @type {Record<string, { title: string, modules: string[] }>}
     */
    module_group: {},
    /**
     * Idiomas disponíveis na interface. Configuração estática, nunca mutada em runtime.
     * @type {Record<string, { name: string, flag: string }>}
     */
    languages: {
      pt: { name: "Português", flag: "br" },
      es: { name: "Español", flag: "es" },
    },
    /** Estado do diálogo de alerta global. */
    alert: {
      show: false,
      title: "",
      text: "",
      error: "",
      color: "",
      buttons: [],
      value: "",
      translate: false,
    },
  }),

  getters: {
    /** Lê qualquer path dot-notation do state. Sem path retorna o state inteiro. */
    getData:
      (state) =>
      (path = "") =>
        _walkGet(state, path),
    /** Verifica se um path dot-notation existe no state. */
    exists: (state) => (path) => _walkExists(state, path),
  },

  actions: {
    // ── Flags escalares ──────────────────────────────────────────────────────
    SET_LOADING(value) {
      this.loading = value;
    },
    SET_IS_DARK(value) {
      this.is_dark = value;
    },
    SET_IS_DEV(value) {
      this.is_dev = value;
    },
    SET_IS_POPUP(value) {
      this.is_popup = value;
    },
    SET_IS_MOBILE(value) {
      this.is_mobile = value;
    },
    SET_IS_DESKTOP(value) {
      this.is_desktop = value;
    },
    SET_IS_ONLINE(value) {
      this.is_online = value;
    },
    SET_IMPORT_MODULES(value) {
      this.import_modules = value;
    },

    // ── Popup ─────────────────────────────────────────────────────────────────
    SET_POPUP(value) {
      this.popup = value;
    },
    SET_POPUP_MODULE(value) {
      this.popup_module = value;
    },

    // ── Module group ──────────────────────────────────────────────────────────
    SET_MODULE_GROUP(value) {
      this.module_group = value;
    },

    // ── Alert ─────────────────────────────────────────────────────────────────
    /** Atualiza um campo individual dentro de state.alert. */
    PATCH_ALERT({ key, value }) {
      this.alert[key] = value;
    },

    // ── Módulos ───────────────────────────────────────────────────────────────
    /**
     * Escreve dentro de state.modules[id].
     * @param {{ id: string, path: string, value: any }} param
     *   path pode ser '' (substitui objeto inteiro) ou 'show', 'config.title', etc.
     */
    SET_MODULE_PATH({ id, path, value }) {
      if (!this.modules[id]) this.modules[id] = {};
      if (!path) {
        Object.assign(this.modules[id], value);
      } else {
        _walkSet(this.modules[id], path, value);
      }
    },

    // ── Deprecated (legado) ───────────────────────────────────────────────────

    /** @deprecated Use SET_MODULE_PATH, PATCH_ALERT ou uma action nomeada. */
    setData(data) {
      if (import.meta.env.DEV) {
        console.warn(
          "[store] setData() deprecated — use named action. Keys:",
          data.slice(0, -1).join(".")
        );
      }
      const value = data.pop();
      const param = data.join(".");
      _walkSet(this, param, value);
    },

    /** @deprecated Use SET_MODULE_PATH ou uma action nomeada. */
    addElementArray(data) {
      if (import.meta.env.DEV) {
        console.warn("[store] addElementArray() deprecated.");
      }
      const value = data.pop();
      const param = data.join(".");
      const arr = _walkGet(this, param);
      if (Array.isArray(arr)) arr.push(value);
    },

    /** @deprecated Use SET_MODULE_PATH ou uma action nomeada. */
    removeElementArray(data) {
      if (import.meta.env.DEV) {
        console.warn("[store] removeElementArray() deprecated.");
      }
      const value = data.pop();
      const param = data.join(".");
      const current = _walkGet(this, param);
      if (Array.isArray(current)) {
        _walkSet(
          this,
          param,
          current.filter((item) => item !== value)
        );
      }
    },
  },
});
