export default {
  set(item, data, type = "local") {
    if (typeof data == "object") {
      data = JSON.stringify(data);
    }

    this.storage(type).setItem(item, data);
  },
  get(item, ifnull = null, type = "local") {
    let data = this.storage(type).getItem(item);

    if (!data) {
      return ifnull;
    }

    if (ifnull == null) {
      let data_parse;
      try {
        data_parse = JSON.parse(data);
      } catch {
        data_parse = data;
      }
      return data_parse;
    } else if (typeof ifnull == "object") {
      return JSON.parse(data);
    } else {
      return data;
    }
  },
  remove(item, type = "local") {
    this.storage(type).removeItem(item);
  },
  removeAll(item, type = "local") {
    for (let i = this.storage(type).length - 1; i >= 0; i--) {
      const key = this.storage(type).key(i);
      if (key.split(":")[0] == item) {
        this.remove(key);
      }
    }
  },

  storage(type = "local") {
    if (type == "session") {
      return sessionStorage;
    } else {
      return localStorage;
    }
  },
};
