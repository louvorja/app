import store from "@/store";

export default {
  set(param, value) {
    store.commit("setData", [param, value]);

    const popup_instance = this.get("popup_instance");
    const popups = this.get("popups") || {};

    const activePopups = [];
    if (popup_instance) activePopups.push({ key: "popup_instance", win: popup_instance });
    Object.keys(popups).forEach((key) => {
      activePopups.push({ key: `popups.${key}`, win: popups[key] });
    });

    if (
      activePopups.length > 0 &&
      param != "popups" &&
      param != "popup_instance" &&
      param != "is_popup" &&
      param != "is_fullscreen"
    ) {
      activePopups.forEach((item) => {
        const popup = item.win;
        if (popup && !popup.closed) {
          try {
            popup.postMessage({ param, value }, window.location.origin);
          } catch (e) {
            console.log(e);
          }
        }
      });
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
    delete data.popups;
    delete data.popup_instance;
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

  toogle(param) {
    this.set(param, !this.get(param));
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
