export default {
  db(path) {
    const url = import.meta.env.VITE_URL_DATABASE;
    return url + path;
  },
  file(path) {
    //const url = import.meta.env.VITE_URL_FILES;
    //return url + path;
    return path;
  },
};
