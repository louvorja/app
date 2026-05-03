import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import store from "./store";
import { loadFonts } from "./plugins/webfontloader";
import { createI18nInstance } from "./i18n";
import shortkey from "vue3-shortkey";
import VueFullscreen from "vue-fullscreen";
import "./assets/styles/tokens.css";
import "./assets/styles/main.css";
import "./assets/styles/fonts.css";
import "./assets/styles/layout.scss";

loadFonts();

const app = createApp(App);

//Modules
import ModuleManager from "@/helpers/ModuleManager";
import $storage from "@/helpers/Storage";
import Platform from "@/helpers/Platform";

//Helpers
import Modules from "@/helpers/Modules";
import Dev from "@/helpers/Dev";
import Strings from "@/helpers/Strings";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";
import DateTime from "@/helpers/DateTime";
import Path from "@/helpers/Path";
import Media from "@/helpers/Media";
import Alert from "@/helpers/Alert";
import Popup from "@/helpers/Popup";
import Database from "@/helpers/Database";
import Favorites from "@/helpers/Favorites";
import History from "@/helpers/History";
import Broadcast from "@/helpers/Broadcast";
import Liturgy from "@/helpers/Liturgy";
import Shortcuts from "@/helpers/Shortcuts";
import Hotkeys from "@/helpers/Hotkeys";
import { useShell } from "@/composables/useShell";

// Registra helpers como globalProperties (shared via prototype chain)
// Equivalente ao mixin.beforeCreate mas sem duplicar propriedades por instância.
// Todos os componentes continuam acessando via this.$xxx normalmente.
Object.assign(app.config.globalProperties, {
  $userdata: UserData,
  $appdata: AppData,
  $modules: Modules,
  $dev: Dev,
  $string: Strings,
  $datetime: DateTime,
  $path: Path,
  $media: Media,
  $alert: Alert,
  $popup: Popup,
  $database: Database,
  $favorites: Favorites,
  $history: History,
  $broadcast: Broadcast,
  $liturgy: Liturgy,
  $platform: Platform,
  $shortcuts: Shortcuts,
  $hotkeys: Hotkeys,
});

app.use(router);
app.use(vuetify);
app.use(store);
app.use(shortkey, { prevent: ["input", "textarea"] });
app.use(VueFullscreen);

// ---------------------------------------------------------------------------
// Helpers para obter o módulo ativo e a referência ao shell
// ---------------------------------------------------------------------------

/** Retorna o id do módulo visível mais recente (exceto media/lyric/album). */
function _getActiveModuleId() {
  const modules = AppData.get("modules") || {};
  const skip = new Set(["media", "lyric", "album"]);
  // Percorre as chaves em ordem reversa de inserção (último aberto)
  const ids = Object.keys(modules).reverse();
  for (const id of ids) {
    if (skip.has(id)) continue;
    if (modules[id]?.show === true) return id;
  }
  return null;
}

/** Retorna true se há media aberta (módulo media visível OU minimizado com música). */
function _mediaIsActive() {
  return (
    AppData.get("modules.media.show", false) ||
    AppData.get("modules.media.minimized", false)
  );
}

/** Retorna o composable singleton do shell (com openCommandPalette / openHotkeysCheatsheet). */
function _shell() {
  return useShell();
}

// ---------------------------------------------------------------------------
// Aguardar hidratação do storage antes de montar o app.
// No web/PWA é no-op síncrono (resolve imediatamente).
// No Electron carrega os dados de userData/storage/ para o cache em memória.
// ---------------------------------------------------------------------------
$storage.hydrate().then(async () => {
  // Migração one-time de dados legados da liturgia (modules.liturgy.items → modules.liturgy.weeks.*)
  Liturgy.migrate();

  // D2 — Configurar URLs remotas no main process para o protocolo louvorja://.
  // O renderer lê as variáveis Vite e envia ao main antes de montar a UI.
  if (Platform.isDesktop && Platform.protocol) {
    try {
      await Platform.protocol.setRemoteConfig({
        databaseUrl: import.meta.env.VITE_URL_DATABASE,
        filesUrl: import.meta.env.VITE_URL_FILES,
        apiToken: import.meta.env.VITE_API_TOKEN,
      });
    } catch (e) {
      console.warn("[main] Falha ao configurar protocolo louvorja://:", e);
    }
  }

  // D3 — Configurar API de download FTP no main process.
  if (Platform.isDesktop && Platform.download) {
    try {
      await Platform.download.setApiConfig({
        paramsUrl: "https://api.louvorja.com.br/params?type=env",
        apiToken: import.meta.env.VITE_API_TOKEN ?? "02@v2nFB2Dc",
      });
    } catch (e) {
      console.warn("[main] Falha ao configurar downloader:", e);
    }
  }

  // D6 — Inicializar listener de atalhos globais (no-op no browser/PWA).
  Shortcuts.init();

  // D5 — Conectar eventos do servidor HTTP às ações do app.
  if (Platform.isDesktop) {
    Platform.onHttpEvent((eventType, data) => {
      if (eventType === "http:song-slides") {
        const action = data.action;
        if (action === "next") Media.nextSlide();
        else if (action === "previous") Media.prevSlide();
        else if (action === "close") Media.close(true);
      } else if (eventType === "http:open-song") {
        Media.open({ id_music: data.id_music, mode: data.mode });
      } else if (eventType === "http:drawing-number") {
        Broadcast.send("drawing_number", { number: data.number });
      } else if (eventType === "http:drawing-name") {
        Broadcast.send("drawing_name", { name: data.name });
      }
    });
  }

  createI18nInstance().then((i18n) => {
    app.use(i18n);
    ModuleManager.init(i18n);
    app.mount("#app");

    // ---------------------------------------------------------------------------
    // M2 — Registrar atalhos de teclado in-window após o app montar.
    // ---------------------------------------------------------------------------
    Hotkeys.init();

    // --- Geral ---

    // F1: abre cheatsheet de atalhos
    Hotkeys.register("F1", () => {
      _shell().openHotkeysCheatsheet();
    }, {
      context: "global",
      description: "hotkeys.f1",
      group: "general",
      label: "F1",
    });

    // F5 / F9: refresh — recarrega dados do módulo ativo
    const _refreshHandler = () => {
      // Emite evento via broadcast para que o módulo ativo possa ouvir
      Broadcast.send("module:refresh", {});
    };
    Hotkeys.register("F5", _refreshHandler, {
      context: "global",
      description: "hotkeys.f5",
      group: "general",
      label: "F5",
    });
    Hotkeys.register("F9", _refreshHandler, {
      context: "global",
      description: "hotkeys.f5",
      group: "general",
      label: "F9",
    });

    // Ctrl+K / Cmd+K: Command Palette
    const _openPalette = () => {
      _shell().openCommandPalette();
    };
    Hotkeys.register("Ctrl+k", _openPalette, {
      context: "global",
      description: "hotkeys.ctrl_k",
      group: "general",
      label: "Ctrl+K",
    });
    Hotkeys.register("Meta+k", _openPalette, {
      context: "global",
      description: "hotkeys.ctrl_k",
      group: "general",
      label: "Cmd+K",
    });

    // Ctrl+F: foca campo de busca do módulo ativo via broadcast
    Hotkeys.register("Ctrl+f", () => {
      Broadcast.send("module:focus_search", {});
      // No browser este atalho abre busca nativa; não há como prevenir completamente.
      // preventDefault já está definido no Hotkeys — no Electron funciona; no web pode falhar.
    }, {
      context: "global",
      description: "hotkeys.ctrl_f",
      group: "general",
      label: "Ctrl+F",
    });

    // Esc: fecha módulo ativo
    Hotkeys.register("Escape", () => {
      const id = _getActiveModuleId();
      if (id) Modules.close(id);
    }, {
      context: "global",
      description: "hotkeys.esc",
      group: "general",
      label: "Esc",
    });

    // Ctrl+W: fecha módulo ativo (o browser pode fechar a aba — preventDefault tenta evitar)
    Hotkeys.register("Ctrl+w", () => {
      const id = _getActiveModuleId();
      if (id) Modules.close(id);
    }, {
      context: "global",
      description: "hotkeys.ctrl_w",
      group: "general",
      label: "Ctrl+W",
    });

    // Ctrl+Shift+F2: limpa cache do DB e recarrega dados
    Hotkeys.register("Ctrl+Shift+F2", () => {
      $storage.removeAll("db", "session");
      Broadcast.send("module:refresh", { clearCache: true });
    }, {
      context: "global",
      description: "hotkeys.ctrl_shift_f2",
      group: "system",
      label: "Ctrl+Shift+F2",
    });

    // --- Navegação de slides (contexto: media ativa) ---

    const _ifMedia = (fn) => () => { if (_mediaIsActive()) fn(); };

    Hotkeys.register("Ctrl+ArrowUp", _ifMedia(() => Media.prevSlide()), {
      context: "media",
      description: "hotkeys.ctrl_up",
      group: "navigation",
      label: "Ctrl+↑",
    });
    Hotkeys.register("Ctrl+ArrowDown", _ifMedia(() => Media.nextSlide()), {
      context: "media",
      description: "hotkeys.ctrl_down",
      group: "navigation",
      label: "Ctrl+↓",
    });
    Hotkeys.register("Ctrl+PageUp", _ifMedia(() => Media.prevSlide()), {
      context: "media",
      description: "hotkeys.ctrl_pageup",
      group: "navigation",
      label: "Ctrl+PageUp",
    });
    Hotkeys.register("Ctrl+PageDown", _ifMedia(() => Media.nextSlide()), {
      context: "media",
      description: "hotkeys.ctrl_pagedown",
      group: "navigation",
      label: "Ctrl+PageDown",
    });
    Hotkeys.register("Home", _ifMedia(() => Media.firstSlide()), {
      context: "media",
      description: "hotkeys.home",
      group: "navigation",
      label: "Home",
    });
    Hotkeys.register("End", _ifMedia(() => Media.lastSlide()), {
      context: "media",
      description: "hotkeys.end",
      group: "navigation",
      label: "End",
    });

    // Setas puras ← / → / ↑ / ↓ navegam slides quando media está ativa
    // (replica FormKeyUp Delphi: setas funcionam em qualquer janela com fMusica visível).
    // PageUp/PageDown também navegam slides puros.
    const _prevSlide = _ifMedia(() => Media.prevSlide());
    const _nextSlide = _ifMedia(() => Media.nextSlide());
    Hotkeys.register("ArrowLeft", _prevSlide, {
      context: "media",
      description: "hotkeys.prev_slide",
      group: "navigation",
      label: "←",
      preventDefault: false, // Não prevenir default em listas/inputs do app
    });
    Hotkeys.register("ArrowRight", _nextSlide, {
      context: "media",
      description: "hotkeys.next_slide",
      group: "navigation",
      label: "→",
      preventDefault: false,
    });
    Hotkeys.register("ArrowUp", _prevSlide, {
      context: "media",
      description: "hotkeys.prev_slide",
      group: "navigation",
      label: "↑",
      preventDefault: false,
    });
    Hotkeys.register("ArrowDown", _nextSlide, {
      context: "media",
      description: "hotkeys.next_slide",
      group: "navigation",
      label: "↓",
      preventDefault: false,
    });
    Hotkeys.register("PageUp", _prevSlide, {
      context: "media",
      description: "hotkeys.prev_slide",
      group: "navigation",
      label: "PageUp",
    });
    Hotkeys.register("PageDown", _nextSlide, {
      context: "media",
      description: "hotkeys.next_slide",
      group: "navigation",
      label: "PageDown",
    });

    // Ctrl+← / Ctrl+→: música anterior / próxima
    // Media.js não tem next()/prev() para álbum — emite broadcast para o módulo ouvir
    Hotkeys.register("Ctrl+ArrowLeft", _ifMedia(() => {
      Broadcast.send("media:prev_music", {});
    }), {
      context: "media",
      description: "hotkeys.ctrl_left",
      group: "navigation",
      label: "Ctrl+←",
    });
    Hotkeys.register("Ctrl+ArrowRight", _ifMedia(() => {
      Broadcast.send("media:next_music", {});
    }), {
      context: "media",
      description: "hotkeys.ctrl_right",
      group: "navigation",
      label: "Ctrl+→",
    });

    // Space / Pause: toggle play/pause (só quando media ativa)
    const _togglePlayPause = _ifMedia(() => {
      const isPaused = AppData.get("modules.media.config.is_paused", true);
      // Apenas faz sentido quando há áudio carregado
      const hasAudio = AppData.get("modules.media.config.audio", "") !== "";
      if (!hasAudio) return;
      if (isPaused) Media.play();
      else Media.pause();
    });
    Hotkeys.register("Space", _togglePlayPause, {
      context: "media",
      description: "hotkeys.space",
      group: "media",
      label: "Space",
    });
    Hotkeys.register("Pause", _togglePlayPause, {
      context: "media",
      allowInForm: false,
      description: "hotkeys.pause",
      group: "media",
      label: "Pause",
    });

    // --- Liturgia ---

    // Ctrl+N: novo item (liturgia ativa)
    Hotkeys.register("Ctrl+n", () => {
      Broadcast.send("liturgy:new_item", {});
    }, {
      context: "global",
      description: "hotkeys.ctrl_n",
      group: "liturgy",
      label: "Ctrl+N",
    });

    // Ctrl+Shift+N: nova anotação na liturgia
    Hotkeys.register("Ctrl+Shift+n", () => {
      Modules.open("liturgy");
      Broadcast.send("liturgy:new_annotation", {});
    }, {
      context: "global",
      description: "hotkeys.ctrl_shift_n",
      group: "liturgy",
      label: "Ctrl+Shift+N",
    });
  });
});
