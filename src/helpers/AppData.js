import store from "@/store";

export default {
  /**
   * Sets a value in the application's global store and synchronizes it across Electron windows.
   */
  set(param, value) {
    store.commit("setData", [param, value]);

    // Robust provider identification: Main window uses empty or root hash in HashHistory
    const isProvider = !window.location.hash || 
                       window.location.hash === "#/" || 
                       window.location.hash === "";

    // Sync with Electron windows
    if (window.electronAPI && window.electronAPI.syncState) {
        const ignoredParams = [
          "is_projection", "is_operator", "is_return", "is_desktop", 
          "is_dev", "is_online", "popup", "is_popup", "is_fullscreen"
        ];
        
        // Params allowed to be broadcasted FROM sub-windows (e.g., control feedback)
        const allowedFromSync = [
          "modules.media.config.slide_index",
          "modules.media.config.is_paused",
          "modules.media.config.volume"
        ];

        if (!ignoredParams.includes(param)) {
            // Only the main window (provider) can broadcast global state changes.
            // Sub-windows (consumers) can only broadcast allowed interaction parameters.
            if (isProvider || allowedFromSync.includes(param)) {
                window.electronAPI.syncState({ param, value });
            }
        }
    }

    // Legacy popup communication
    const popup = this.get("popup");
    if (popup && popup.postMessage && param != "popup" && param != "is_popup" && param != "is_fullscreen") {
        try {
            if (!popup.closed) {
                popup.postMessage({ param, value }, window.location.origin);
            } else {
                this.set("popup", null);
            }
        } catch (e) {
            console.warn("[AppData] Popup postMessage failed:", e.message);
        }
    }
  },

  /**
   * Retrieves a value from the application's global store.
   */
  get(param, ifnull = null) {
    if (param && !store.getters.exists(param)) {
      return ifnull;
    }
    return store.getters.getData(param);
  },

  /**
   * Gets a flattened version of the entire application state.
   */
  getFlatten() {
    let data = Object.assign({}, this.get());
    // Exclude non-serializable or window-specific objects
    delete data.popup;
    delete data.is_popup;
    data = JSON.parse(JSON.stringify(data));
    return this.flatten(data);
  },

  /**
   * Flattens a nested object into a single-level object with dot-notated keys.
   */
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

  addElement(param, value) {
    store.commit("addElementArray", [param, value]);
  },

  removeElement(param, value) {
    store.commit("removeElementArray", [param, value]);
  },

  toogle(param) {
    this.set(param, !this.get(param));
  },

  exists(param) {
    return store.getters.exists(param);
  },
};
