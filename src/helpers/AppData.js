import store from "@/store";

// Caminhos de primeiro nível que mapeiam 1:1 para uma mutation nomeada.
const _SCALAR_MUTATIONS = {
  loading: "SET_LOADING",
  is_dark: "SET_IS_DARK",
  is_dev: "SET_IS_DEV",
  is_popup: "SET_IS_POPUP",
  is_mobile: "SET_IS_MOBILE",
  is_desktop: "SET_IS_DESKTOP",
  is_online: "SET_IS_ONLINE",
  import_modules: "SET_IMPORT_MODULES",
  popup: "SET_POPUP",
  popup_module: "SET_POPUP_MODULE",
  module_group: "SET_MODULE_GROUP",
};

export default {
  set(param, value) {
    const parts = param.split(".");
    const root = parts[0];

    if (_SCALAR_MUTATIONS[root] && parts.length === 1) {
      // Scalar top-level flag — mutation nomeada direta.
      store.commit(_SCALAR_MUTATIONS[root], value);
    } else if (root === "alert") {
      // alert.<key> = value
      store.commit("PATCH_ALERT", { key: parts[1], value });
    } else if (root === "modules" && parts.length >= 2) {
      // modules.<id>[.<path>] = value
      const id = parts[1];
      const path = parts.slice(2).join(".");
      store.commit("SET_MODULE_PATH", { id, path, value });
    } else if (root === "user_data" && parts.length >= 2) {
      // user_data.<path> = value
      const path = parts.slice(1).join(".");
      store.commit("SET_USER_DATA_PATH", { path, value });
    } else {
      // Fallback deprecated — caminhos desconhecidos ou compostos (ex: Popup.vue
      // recebe event.data.param dinamicamente e pode ser qualquer coisa).
      store.commit("setData", [param, value]);
    }

    // Sincroniza popup quando appdata muda (mantém estado entre janelas).
    const popup = this.get("popup");
    if (popup && param != "popup" && param != "is_popup" && param != "is_fullscreen") {
      if (popup.closed) {
        this.set("popup", null);
      } else {
        try {
          popup.postMessage({ param, value }, window.location.origin);
        } catch (e) {
          console.log(e);
        }
      }
    }
  },

  get(param, ifnull = null) {
    if (param && !store.getters.exists(param)) {
      return ifnull;
    }

    return store.getters.getData(param);
  },

  getFlatten() {
    let data = Object.assign({}, this.get());
    delete data.popup;
    delete data.is_popup;
    data = JSON.parse(JSON.stringify(data));
    return this.flatten(data);
  },

  addElement(param, value) {
    store.commit("addElementArray", [param, value]);
  },

  removeElement(param, value) {
    store.commit("removeElementArray", [param, value]);
  },

  toggle(param) {
    this.set(param, !this.get(param));
  },

  /** @deprecated Use `toggle` (correct spelling). Will be removed in a future release. */
  toogle(param) {
    if (import.meta.env.DEV && !this._toogleWarned) {
      console.warn("[AppData] toogle() is deprecated; use toggle() instead.");
      this._toogleWarned = true;
    }
    return this.toggle(param);
  },

  exists(param) {
    return store.getters.exists(param);
  },

  flatten(data, parent = "", result = {}) {
    for (let key in data) {
      const prop = data[key];
      const newKey = parent ? `${parent}.${key}` : key;
      if (typeof prop === "object" && !Array.isArray(prop) && prop !== null) {
        this.flatten(prop, newKey, result);
      } else {
        result[newKey] = prop;
      }
    }
    return result;
  },
};
