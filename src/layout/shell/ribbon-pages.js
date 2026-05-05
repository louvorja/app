/**
 * ribbon-pages.js — Configuração das pages e grupos do Ribbon.
 *
 * Replica fielmente o ribbon Delphi (fmMenu.dfm): tabs principais
 * "Coletâneas | Coletâneas On-line | Bíblia | Utilitários | Favoritos"
 * + tabs contextuais que aparecem ao abrir módulos específicos.
 */

export const RIBBON_PAGES = [
  // ========== Coletâneas (página default) ==========
  {
    id: "collections",
    title: "ribbon.pages.collections",
    defaultModule: null,
    groups: [
      {
        id: "hymnal",
        title: "ribbon.groups.hymnal_adventist",
        buttons: [
          {
            id: "hymnal",
            icon: "mdi-book-music",
            label: "ribbon.btn.hymnal",
            module: "hymnal",
            color: "#c0392b",
          },
        ],
      },
      {
        id: "albums",
        title: "ribbon.groups.albums",
        buttons: [
          {
            id: "musics",
            icon: "mdi-music-circle",
            label: "ribbon.btn.ja_musics",
            module: "musics",
            color: "#1b4f8a",
          },
          {
            id: "diverse",
            icon: "mdi-folder-multiple",
            label: "ribbon.btn.diverse",
            module: "collections",
            color: "#16a085",
          },
        ],
      },
      {
        id: "categories",
        title: "ribbon.groups.categories",
        buttons: [
          {
            id: "doxology",
            icon: "mdi-star-circle",
            label: "ribbon.btn.doxology",
            action: "open_doxology",
            color: "#f39c12",
          },
          {
            id: "kids",
            icon: "mdi-account-child-circle",
            label: "ribbon.btn.kids",
            action: "open_kids",
            color: "#e91e63",
          },
        ],
      },
      {
        id: "user",
        title: "ribbon.groups.user",
        buttons: [
          {
            id: "personal",
            icon: "mdi-folder-heart",
            label: "ribbon.btn.personal",
            module: "collections",
            color: "#c0392b",
          },
          {
            id: "liturgy",
            icon: "mdi-view-list-outline",
            label: "ribbon.btn.liturgy",
            module: "liturgy",
            color: "#27ae60",
          },
        ],
      },
      {
        id: "search",
        title: "ribbon.groups.search",
        buttons: [
          {
            id: "search_music",
            icon: "mdi-magnify",
            label: "ribbon.btn.search_music",
            action: "search_music",
            color: "#3498db",
          },
        ],
      },
    ],
  },

  // ========== Coletâneas On-line ==========
  {
    id: "collections_online",
    title: "ribbon.pages.collections_online",
    defaultModule: null,
    groups: [
      {
        id: "online_videos",
        title: "ribbon.groups.online_videos",
        buttons: [
          {
            id: "online_videos",
            icon: "mdi-youtube",
            label: "ribbon.btn.online_videos",
            action: "online_videos",
            color: "#e74c3c",
          },
          {
            id: "online_personal",
            icon: "mdi-link",
            label: "ribbon.btn.online_personal",
            action: "online_personal",
            color: "#3498db",
          },
        ],
      },
    ],
  },

  // ========== Bíblia ==========
  {
    id: "bible",
    title: "ribbon.pages.bible",
    defaultModule: "bible",
    groups: [
      {
        id: "bible_general",
        title: "ribbon.groups.general",
        buttons: [
          {
            id: "bible_search",
            icon: "mdi-book-search",
            label: "ribbon.btn.bible_search",
            action: "bible_search",
            color: "#16a085",
          },
          {
            id: "bible_open",
            icon: "mdi-book-open-variant",
            label: "ribbon.btn.bible",
            module: "bible",
            color: "#c0392b",
          },
        ],
      },
    ],
  },

  // ========== Utilitários ==========
  {
    id: "utilities",
    title: "ribbon.pages.utilities",
    defaultModule: null,
    groups: [
      {
        id: "church",
        title: "ribbon.groups.church",
        buttons: [
          {
            id: "stopwatch_culto",
            icon: "mdi-timer-sand",
            label: "ribbon.btn.stopwatch_culto",
            module: "stopwatch",
            color: "#1b4f8a",
          },
          {
            id: "scheduled_items",
            icon: "mdi-calendar-check",
            label: "ribbon.btn.scheduled_items",
            module: "liturgy",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "draws",
        title: "ribbon.groups.draws",
        buttons: [
          {
            id: "draw",
            icon: "mdi-dice-multiple",
            label: "ribbon.btn.draw",
            module: "draw",
            color: "#3498db",
          },
          {
            id: "name_draw",
            icon: "mdi-account-multiple",
            label: "ribbon.btn.name_draw",
            module: "name_draw",
            color: "#e91e63",
          },
        ],
      },
      {
        id: "time",
        title: "ribbon.groups.time",
        buttons: [
          {
            id: "clock",
            icon: "mdi-clock-outline",
            label: "ribbon.btn.clock",
            module: "clock",
            color: "#27ae60",
          },
          {
            id: "stopwatch",
            icon: "mdi-timer",
            label: "ribbon.btn.stopwatch",
            module: "stopwatch",
            color: "#e74c3c",
          },
        ],
      },
      {
        id: "texts",
        title: "ribbon.groups.texts",
        buttons: [
          {
            id: "message_board",
            icon: "mdi-message-bulleted",
            label: "ribbon.btn.dynamic_text",
            module: "message_board",
            color: "#f39c12",
          },
          {
            id: "interactive_text",
            icon: "mdi-format-quote-close",
            label: "ribbon.btn.interactive_text",
            action: "interactive_text",
            color: "#9b59b6",
          },
          {
            id: "slide_editor",
            icon: "mdi-presentation-play",
            label: "ribbon.btn.slide_editor",
            module: "slide_editor",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Favoritos ==========
  {
    id: "favorites",
    title: "ribbon.pages.favorites",
    defaultModule: "favorites",
    groups: [
      {
        id: "favorites_list",
        title: "ribbon.groups.favorites",
        buttons: [
          {
            id: "favorites",
            icon: "mdi-star",
            label: "ribbon.btn.favorites",
            module: "favorites",
            color: "#f39c12",
          },
          {
            id: "history",
            icon: "mdi-history",
            label: "ribbon.btn.history",
            module: "history",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Tabs contextuais (laranja) ==========
  // Aparecem APENAS quando o módulo correspondente está aberto.
  {
    id: "ctx_hymnal",
    title: "ribbon.pages.ctx_hymnal",
    contextual: true,
    activeOnModules: ["hymnal"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_hymnal_info",
        title: "ribbon.groups.info",
        buttons: [
          {
            id: "lyric",
            icon: "mdi-text-box-outline",
            label: "ribbon.btn.lyric",
            action: "open_lyric",
            color: "#1b4f8a",
          },
        ],
      },
      {
        id: "ctx_hymnal_slide",
        title: "ribbon.groups.slide",
        buttons: [
          {
            id: "sing",
            icon: "mdi-music",
            label: "ribbon.btn.sing",
            action: "mode_audio",
            color: "#27ae60",
          },
          {
            id: "playback",
            icon: "mdi-music-box-multiple",
            label: "ribbon.btn.playback",
            action: "mode_instrumental",
            color: "#3498db",
          },
          {
            id: "no_audio",
            icon: "mdi-music-off",
            label: "ribbon.btn.no_audio",
            action: "mode_no_audio",
            color: "#7f8c8d",
          },
          {
            id: "sequence",
            icon: "mdi-format-list-numbered",
            label: "ribbon.btn.sequence",
            action: "play_sequence",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_hymnal_audio",
        title: "ribbon.groups.audio_file",
        buttons: [
          {
            id: "audio_play",
            icon: "mdi-volume-high",
            label: "ribbon.btn.sing",
            action: "mode_audio",
            color: "#27ae60",
          },
          {
            id: "audio_inst",
            icon: "mdi-piano",
            label: "ribbon.btn.playback",
            action: "mode_instrumental",
            color: "#3498db",
          },
        ],
      },
      {
        id: "ctx_hymnal_export",
        title: "ribbon.groups.export",
        buttons: [
          {
            id: "export_music",
            icon: "mdi-export",
            label: "ribbon.btn.export_music",
            action: "export_music",
            color: "#16a085",
          },
        ],
      },
      {
        id: "ctx_hymnal_error",
        title: "ribbon.groups.error",
        buttons: [
          {
            id: "report_error",
            icon: "mdi-alert-circle",
            label: "ribbon.btn.report_error",
            action: "report_error",
            color: "#e74c3c",
          },
        ],
      },
    ],
  },
  {
    id: "ctx_liturgy",
    title: "ribbon.pages.ctx_liturgy",
    contextual: true,
    activeOnModules: ["liturgy"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_liturgy_add",
        title: "ribbon.groups.add",
        buttons: [
          {
            id: "add_item",
            icon: "mdi-plus-box",
            label: "ribbon.btn.add_item",
            action: "lit_add_item",
            color: "#1b4f8a",
          },
        ],
      },
      {
        id: "ctx_liturgy_items",
        title: "ribbon.groups.items",
        buttons: [
          {
            id: "check_all",
            icon: "mdi-checkbox-marked",
            label: "ribbon.btn.check_all",
            action: "lit_check_all",
            size: "small",
          },
          {
            id: "uncheck_all",
            icon: "mdi-checkbox-blank-outline",
            label: "ribbon.btn.uncheck_all",
            action: "lit_uncheck_all",
            size: "small",
          },
          {
            id: "invert_selection",
            icon: "mdi-swap-horizontal",
            label: "ribbon.btn.invert_selection",
            action: "lit_invert",
            size: "small",
          },
          {
            id: "delete_selected",
            icon: "mdi-delete",
            label: "ribbon.btn.delete_selected",
            action: "lit_delete",
            color: "#e74c3c",
          },
        ],
      },
      {
        id: "ctx_liturgy_options",
        title: "ribbon.groups.options",
        buttons: [
          {
            id: "mark_done",
            icon: "mdi-check-circle",
            label: "ribbon.btn.mark_done",
            action: "lit_mark_done",
            size: "small",
          },
          {
            id: "show_notes",
            icon: "mdi-note-text",
            label: "ribbon.btn.show_notes",
            action: "lit_show_notes",
            size: "small",
          },
          {
            id: "lock_items",
            icon: "mdi-lock",
            label: "ribbon.btn.lock_items",
            action: "lit_lock",
            size: "small",
          },
        ],
      },
    ],
  },
];

/**
 * Mapeamento de IDs de módulo → ícones para uso fora do Ribbon
 * (StatusBar, popup de módulos abertos, etc).
 */
export const MODULE_ICONS = {
  hymnal: "mdi-book-music",
  bible: "mdi-book-open-variant",
  musics: "mdi-music-circle",
  album: "mdi-album",
  collections: "mdi-folder-multiple",
  slide_editor: "mdi-presentation-play",
  liturgy: "mdi-view-list-outline",
  favorites: "mdi-star",
  history: "mdi-history",
  stopwatch: "mdi-timer",
  clock: "mdi-clock-outline",
  draw: "mdi-dice-multiple",
  name_draw: "mdi-account-multiple",
  counter: "mdi-counter",
  message_board: "mdi-message-bulleted",
  transmission: "mdi-monitor-multiple",
  remote_control: "mdi-remote",
  theme: "mdi-palette",
  update: "mdi-update",
  downloads: "mdi-cloud-download",
  dev: "mdi-tools",
};
