export default {
  getData:
    (state) =>
    (data = "") => {
      if (!data) return state;

      const keys = data.split(".");
      let result = state;

      for (let key of keys) {
        if (result) {
          result = result[key];
        } else {
          return undefined;
        }
      }

      return result;
    },

  exists: (state) => (data) => {
    const keys = data.split(".");
    let current = state;

    for (let i = 0; i < keys.length; i++) {
      if (current === null || current === undefined || !(keys[i] in current)) {
        return false;
      }
      current = current[keys[i]];
    }
    return current !== undefined;
  },
};
