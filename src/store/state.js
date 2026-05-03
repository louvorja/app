export default {
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
  user_data: {
    theme: "",
    language: "",
    layout: "apps",
    remote: {
      is_connected: false,
      url: "",
      token: "",
    },
    favorites: [],
    history: [],
    modules: {
      musics: {
        search: {
          name: true,
          lyric: false,
          album: false,
          track: false,
        },
        filter: {
          instrumental_music: false,
        },
      },
      media: {
        lazy_load: true,
        fade_audio: false,
      },
    },
  },
};
