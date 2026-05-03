import store from "@/store";

export default {
  set(param, value) {
    store.commit("setData", [param, value]);

    const popup = this.get("popup");
    if (
      popup &&
      param != "popup" &&
      param != "is_popup" &&
      param != "is_fullscreen"
    ) {
      if (popup.closed) {
        this.set("popup", null);
        //this.set("popup_module", null);
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
