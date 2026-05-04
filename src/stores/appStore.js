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
    is_dev: false,
    is_dark: false,
    is_popup: false,
    is_mobile: false,
    is_desktop: false,
    is_online: false,
    popup: null,
    popup_module: null,
    import_modules: false,
    loading: false,
    modules: {},
    module_group: {
      musics: {
        title: "module_group.musics.title",
        modules: ["musics", "hymnal"],
      },
      bible: {
        title: "module_group.bible.title",
        modules: [],
      },
      utilities: {
        title: "module_group.utilities.title",
        modules: [],
      },
    },
    languages: {
      pt: { name: "Português", flag: "br" },
      es: { name: "Español", flag: "es" },
    },
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
