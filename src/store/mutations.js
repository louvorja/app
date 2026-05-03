// Utilitário: percorre `obj` via notação de ponto e atribui `value` na folha.
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

export default {
  // ── Mutations nomeadas ──────────────────────────────────────────────────────

  // Flags globais (scalares)
  SET_LOADING(state, value) {
    state.loading = value;
  },
  SET_IS_DARK(state, value) {
    state.is_dark = value;
  },
  SET_IS_DEV(state, value) {
    state.is_dev = value;
  },
  SET_IS_POPUP(state, value) {
    state.is_popup = value;
  },
  SET_IS_MOBILE(state, value) {
    state.is_mobile = value;
  },
  SET_IS_DESKTOP(state, value) {
    state.is_desktop = value;
  },
  SET_IS_ONLINE(state, value) {
    state.is_online = value;
  },
  SET_IMPORT_MODULES(state, value) {
    state.import_modules = value;
  },

  // Popup
  SET_POPUP(state, value) {
    state.popup = value;
  },
  SET_POPUP_MODULE(state, value) {
    state.popup_module = value;
  },

  // Module group (registro de módulos por categoria)
  SET_MODULE_GROUP(state, value) {
    state.module_group = value;
  },

  // Alert — atualiza um campo individual dentro de state.alert
  PATCH_ALERT(state, { key, value }) {
    state.alert[key] = value;
  },

  // Módulos — caminho genérico dentro de state.modules[id]
  // payload: { id: string, path: string, value: any }
  // path pode ser '' (substitui o objeto inteiro) ou 'show', 'config.title', etc.
  SET_MODULE_PATH(state, { id, path, value }) {
    if (!state.modules[id]) state.modules[id] = {};
    if (!path) {
      Object.assign(state.modules[id], value);
    } else {
      _walkSet(state.modules[id], path, value);
    }
  },

  // User data — caminho genérico dentro de state.user_data
  // payload: { path: string, value: any }
  SET_USER_DATA_PATH(state, { path, value }) {
    _walkSet(state.user_data, path, value);
  },

  // ── Mutations deprecadas ────────────────────────────────────────────────────
  // Mantidas como fallback para caminhos desconhecidos / callers legados.
  // O warning em DEV ajuda a identificar os usos remanescentes.

  /** @deprecated Use SET_MODULE_PATH, SET_USER_DATA_PATH ou uma mutation nomeada. */
  setData(state, data) {
    if (import.meta.env.DEV) {
      console.warn(
        "[store] setData() deprecated — use named mutation. Keys:",
        data.slice(0, -1).join(".")
      );
    }
    const value = data.pop();
    const param = data.join(".");
    _walkSet(state, param, value);
  },

  /** @deprecated Use SET_MODULE_PATH ou uma mutation nomeada. */
  addElementArray(state, data) {
    if (import.meta.env.DEV) {
      console.warn("[store] addElementArray() deprecated. Keys:", data.slice(0, -1).join("."));
    }
    const value = data.pop();
    const param = data.join(".");
    const keys = param.split(".");
    let cur = state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]].push(value);
  },

  /** @deprecated Use SET_MODULE_PATH ou uma mutation nomeada. */
  removeElementArray(state, data) {
    if (import.meta.env.DEV) {
      console.warn("[store] removeElementArray() deprecated. Keys:", data.slice(0, -1).join("."));
    }
    const value = data.pop();
    const param = data.join(".");
    const keys = param.split(".");
    let cur = state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = cur[keys[keys.length - 1]].filter((item) => item !== value);
  },
};
