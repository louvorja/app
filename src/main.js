import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import store from "./store";
import { loadFonts } from "./plugins/webfontloader";
import { createI18nInstance } from "./i18n";
import shortkey from "vue3-shortkey";
import VueFullscreen from "vue-fullscreen";
import "./assets/styles/main.css";
import "./assets/styles/fonts.css";
import "./assets/styles/layout.scss";

loadFonts();

const app = createApp(App);

//Modules
import ModuleManager from "@/helpers/ModuleManager";

//Helpers
import Modules from "@/helpers/Modules";
import Dev from "@/helpers/Dev";
import String from "@/helpers/String";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";
import DateTime from "@/helpers/DateTime";
import Theme from "@/helpers/Theme";
import Path from "@/helpers/Path";
import Media from "@/helpers/Media";
import Alert from "@/helpers/Alert";
import Popup from "@/helpers/Popup";
import Database from "@/helpers/Database";
import Screen from "@/helpers/Screen";
import Liturgy from "@/helpers/Liturgy";
import Sermon from "@/helpers/Sermon";
import Announcement from "@/helpers/Announcement";
import Egw from "@/helpers/Egw";
import Flashcards from "@/helpers/Flashcards";
app.mixin({
  beforeCreate() {
    this.$userdata = UserData;
    this.$appdata = AppData;
    this.$modules = Modules;
    this.$dev = Dev;
    this.$string = String;
    this.$datetime = DateTime;
    this.$theme = Theme;
    this.$path = Path;
    this.$media = Media;
    this.$alert = Alert;
    this.$popup = Popup;
    this.$database = Database;
    this.$screen = Screen;
    this.$liturgy = Liturgy;
    this.$sermon = Sermon;
    this.$announcement = Announcement;
    this.$egw = Egw;
    this.$flashcards = Flashcards;
  },
});

app.use(router);
app.use(vuetify);
app.use(store);
app.use(shortkey, { prevent: ["input", "textarea"] });
app.use(VueFullscreen);

createI18nInstance().then((i18n) => {
  app.use(i18n);
  ModuleManager.init(i18n);
  app.mount("#app");
});
