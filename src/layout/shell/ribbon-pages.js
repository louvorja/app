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
    defaultModule: null,
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
            id: "timer_cult",
            icon: "mdi-timer-sand",
            label: "ribbon.btn.timer_cult",
            module: "timer_cult",
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
    defaultModule: null,
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
        ],
      },
      {
        id: "ctx_liturgy_delete",
        title: "ribbon.groups.delete",
        buttons: [
          {
            id: "delete_selected",
            icon: "mdi-close-thick",
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

  // ========== Editor de Músicas (contextual) ==========
  {
    id: "ctx_slide_editor",
    title: "ribbon.pages.ctx_slide_editor",
    contextual: true,
    activeOnModules: ["slide_editor"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_se_file",
        title: "ribbon.groups.file",
        buttons: [
          {
            id: "editor_new",
            icon: "mdi-file-plus-outline",
            label: "ribbon.btn.editor_new",
            action: "editor_new",
            color: "#1b4f8a",
          },
          {
            id: "editor_open",
            icon: "mdi-folder-open-outline",
            label: "ribbon.btn.editor_open",
            action: "editor_open",
            color: "#16a085",
          },
          {
            id: "editor_save",
            icon: "mdi-content-save",
            label: "ribbon.btn.editor_save",
            action: "editor_save",
            color: "#27ae60",
          },
          {
            id: "editor_save_as",
            icon: "mdi-content-save-edit-outline",
            label: "ribbon.btn.editor_save_as",
            action: "editor_save_as",
            color: "#27ae60",
            size: "small",
          },
          {
            id: "editor_import_txt",
            icon: "mdi-file-import-outline",
            label: "ribbon.btn.editor_import_txt",
            action: "editor_import_txt",
            color: "#7f8c8d",
            size: "small",
          },
        ],
      },
      {
        id: "ctx_se_slides",
        title: "ribbon.groups.slides",
        buttons: [
          {
            id: "editor_project",
            icon: "mdi-presentation-play",
            label: "ribbon.btn.editor_project",
            action: "editor_project",
            color: "#9b59b6",
          },
          {
            id: "editor_new_slide",
            icon: "mdi-image-plus-outline",
            label: "ribbon.btn.editor_new_slide",
            action: "editor_new_slide",
            color: "#1b4f8a",
            size: "small",
          },
          {
            id: "editor_duplicate_slide",
            icon: "mdi-content-duplicate",
            label: "ribbon.btn.editor_duplicate_slide",
            action: "editor_duplicate_slide",
            color: "#3498db",
            size: "small",
          },
          {
            id: "editor_remove_slide",
            icon: "mdi-image-remove-outline",
            label: "ribbon.btn.editor_remove_slide",
            action: "editor_remove_slide",
            color: "#e74c3c",
            size: "small",
          },
          {
            id: "editor_split_slide",
            icon: "mdi-arrow-split-horizontal",
            label: "ribbon.btn.editor_split_slide",
            action: "editor_split_slide",
            color: "#16a085",
            size: "small",
          },
          {
            id: "editor_merge_next",
            icon: "mdi-call-merge",
            label: "ribbon.btn.editor_merge_next",
            action: "editor_merge_next",
            color: "#16a085",
            size: "small",
          },
        ],
      },
      {
        id: "ctx_se_audio",
        title: "ribbon.groups.audio_recording",
        buttons: [
          {
            id: "editor_audio_attach",
            icon: "mdi-music-note-plus",
            label: "ribbon.btn.editor_audio_attach",
            action: "editor_audio_attach",
            color: "#1b4f8a",
            size: "small",
          },
          {
            id: "editor_play_pause",
            icon: "mdi-play-pause",
            label: "ribbon.btn.editor_play_pause",
            action: "editor_play_pause",
            color: "#27ae60",
            size: "small",
          },
          {
            id: "editor_record_advance",
            icon: "mdi-record-circle",
            label: "ribbon.btn.editor_record_advance",
            action: "editor_record_advance",
            color: "#e74c3c",
          },
          {
            id: "editor_record_start",
            icon: "mdi-skip-previous",
            label: "ribbon.btn.editor_record_start",
            action: "editor_record_start",
            color: "#7f8c8d",
            size: "small",
          },
          {
            id: "editor_record_retroactive",
            icon: "mdi-rewind",
            label: "ribbon.btn.editor_record_retroactive",
            action: "editor_record_retroactive",
            color: "#7f8c8d",
            size: "small",
          },
          {
            id: "editor_record_clear",
            icon: "mdi-eraser",
            label: "ribbon.btn.editor_record_clear",
            action: "editor_record_clear",
            color: "#7f8c8d",
            size: "small",
          },
        ],
      },
      {
        id: "ctx_se_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "editor_image_set",
            icon: "mdi-image-outline",
            label: "ribbon.btn.editor_image_set",
            action: "editor_image_set",
            color: "#1b4f8a",
            size: "small",
          },
          {
            id: "editor_image_remove",
            icon: "mdi-image-off-outline",
            label: "ribbon.btn.editor_image_remove",
            action: "editor_image_remove",
            color: "#7f8c8d",
            size: "small",
          },
          {
            id: "editor_replicate_bg",
            icon: "mdi-format-line-spacing",
            label: "ribbon.btn.editor_replicate_bg",
            action: "editor_replicate_bg_all",
            color: "#9b59b6",
            size: "small",
          },
          {
            id: "editor_replicate_text",
            icon: "mdi-format-letter-matches",
            label: "ribbon.btn.editor_replicate_text",
            action: "editor_replicate_text_all",
            color: "#9b59b6",
            size: "small",
          },
        ],
      },
      {
        id: "ctx_se_view",
        title: "ribbon.groups.view",
        buttons: [
          {
            id: "editor_view_full",
            icon: "mdi-monitor",
            label: "ribbon.btn.editor_view_full",
            action: "editor_view_full",
            color: "#1b4f8a",
            size: "small",
          },
          {
            id: "editor_view_4_3",
            icon: "mdi-aspect-ratio",
            label: "ribbon.btn.editor_view_4_3",
            action: "editor_view_4_3",
            color: "#1b4f8a",
            size: "small",
          },
          {
            id: "editor_view_16_9",
            icon: "mdi-television",
            label: "ribbon.btn.editor_view_16_9",
            action: "editor_view_16_9",
            color: "#1b4f8a",
            size: "small",
          },
        ],
      },
    ],
  },

  // ========== Configurar Bíblia (contextual) ==========
  {
    id: "ctx_bible",
    title: "ribbon.pages.ctx_bible",
    contextual: true,
    activeOnModules: ["bible"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_bible_general",
        title: "ribbon.groups.general",
        buttons: [
          {
            id: "bible_clear",
            icon: "mdi-eraser",
            label: "ribbon.btn.bible_clear",
            action: "bible_clear",
            color: "#7f8c8d",
          },
        ],
      },
      {
        id: "ctx_bible_controls",
        title: "ribbon.groups.controls",
        buttons: [
          {
            id: "bible_prev_verse",
            icon: "mdi-arrow-left-bold",
            label: "ribbon.btn.bible_prev_verse",
            action: "bible_prev_verse",
            color: "#16a085",
          },
          {
            id: "bible_next_verse",
            icon: "mdi-arrow-right-bold",
            label: "ribbon.btn.bible_next_verse",
            action: "bible_next_verse",
            color: "#16a085",
          },
        ],
      },
      {
        id: "ctx_bible_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "bible_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.bible_format",
            action: "bible_format",
            color: "#1b4f8a",
          },
          {
            id: "bible_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.bible_restore",
            action: "bible_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_bible_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "bible_project",
            type: "screen",
            feature: "bible",
            route: "/projection/bible",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Contador (contextual) ==========
  {
    id: "ctx_counter",
    title: "ribbon.pages.ctx_counter",
    contextual: true,
    activeOnModules: ["counter"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_counter_actions",
        title: "ribbon.groups.actions",
        buttons: [
          {
            id: "counter_decrement",
            icon: "mdi-minus-box",
            label: "ribbon.btn.counter_decrement",
            action: "counter_decrement",
            color: "#e74c3c",
          },
          {
            id: "counter_increment",
            icon: "mdi-plus-box",
            label: "ribbon.btn.counter_increment",
            action: "counter_increment",
            color: "#27ae60",
          },
          {
            id: "counter_reset",
            icon: "mdi-restart",
            label: "ribbon.btn.counter_reset",
            action: "counter_reset",
            color: "#7f8c8d",
          },
        ],
      },
      {
        id: "ctx_counter_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "counter_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "counter_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "counter_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "counter_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_counter_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "counter_project",
            type: "screen",
            feature: "counter",
            route: "/projection/module?module=counter",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Sorteio de Números (contextual) ==========
  {
    id: "ctx_draw",
    title: "ribbon.pages.ctx_draw",
    contextual: true,
    activeOnModules: ["draw"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_draw_actions",
        title: "ribbon.groups.actions",
        buttons: [
          {
            id: "draw_draw",
            icon: "mdi-dice-5",
            label: "ribbon.btn.draw_action",
            action: "draw_draw",
            color: "#3498db",
          },
          {
            id: "draw_reset",
            icon: "mdi-restart",
            label: "ribbon.btn.draw_reset",
            action: "draw_reset",
            color: "#7f8c8d",
          },
        ],
      },
      {
        id: "ctx_draw_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "draw_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "draw_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "draw_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "draw_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_draw_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "draw_project",
            type: "screen",
            feature: "draw",
            route: "/projection/module?module=draw",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Sorteio de Nomes (contextual) ==========
  {
    id: "ctx_name_draw",
    title: "ribbon.pages.ctx_name_draw",
    contextual: true,
    activeOnModules: ["name_draw"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_name_draw_actions",
        title: "ribbon.groups.actions",
        buttons: [
          {
            id: "name_draw_draw",
            icon: "mdi-account-arrow-right",
            label: "ribbon.btn.name_draw_action",
            action: "name_draw_draw",
            color: "#e91e63",
          },
          {
            id: "name_draw_reset",
            icon: "mdi-restart",
            label: "ribbon.btn.draw_reset",
            action: "name_draw_reset",
            color: "#7f8c8d",
          },
        ],
      },
      {
        id: "ctx_name_draw_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "name_draw_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "name_draw_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "name_draw_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "name_draw_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_name_draw_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "name_draw_project",
            type: "screen",
            feature: "name_draw",
            route: "/projection/module?module=name_draw",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Relógio (contextual) ==========
  {
    id: "ctx_clock",
    title: "ribbon.pages.ctx_clock",
    contextual: true,
    activeOnModules: ["clock"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_clock_options",
        title: "ribbon.groups.options",
        buttons: [
          {
            id: "clock_toggle_24h",
            icon: "mdi-hours-24",
            label: "ribbon.btn.clock_24h",
            action: "clock_toggle_24h",
            color: "#1b4f8a",
          },
          {
            id: "clock_toggle_seconds",
            icon: "mdi-timer",
            label: "ribbon.btn.clock_seconds",
            action: "clock_toggle_seconds",
            color: "#27ae60",
          },
        ],
      },
      {
        id: "ctx_clock_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "clock_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "clock_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "clock_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "clock_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_clock_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "clock_project",
            type: "screen",
            feature: "clock",
            route: "/projection/module?module=clock",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Cronômetro (contextual) ==========
  {
    id: "ctx_stopwatch",
    title: "ribbon.pages.ctx_stopwatch",
    contextual: true,
    activeOnModules: ["stopwatch"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_stopwatch_actions",
        title: "ribbon.groups.actions",
        buttons: [
          {
            id: "stopwatch_toggle",
            icon: "mdi-play-pause",
            label: "ribbon.btn.stopwatch_toggle",
            action: "stopwatch_toggle",
            color: "#27ae60",
          },
          {
            id: "stopwatch_reset",
            icon: "mdi-restart",
            label: "ribbon.btn.stopwatch_reset",
            action: "stopwatch_reset",
            color: "#7f8c8d",
          },
        ],
      },
      {
        id: "ctx_stopwatch_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "stopwatch_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "stopwatch_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "stopwatch_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "stopwatch_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_stopwatch_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "stopwatch_project",
            type: "screen",
            feature: "stopwatch",
            route: "/projection/module?module=stopwatch",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Temporizador de Culto (contextual) ==========
  {
    id: "ctx_timer_cult",
    title: "modules.timer_cult.ribbon.ctx_timer_cult",
    contextual: true,
    activeOnModules: ["timer_cult"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_timer_cult_actions",
        title: "ribbon.groups.actions",
        buttons: [
          {
            id: "timer_cult_toggle",
            icon: "mdi-play-pause",
            label: "ribbon.btn.toggle",
            action: "timer_cult_toggle",
            color: "#27ae60",
          },
          {
            id: "timer_cult_reset",
            icon: "mdi-restart",
            label: "ribbon.btn.reset",
            action: "timer_cult_reset",
            color: "#7f8c8d",
          },
        ],
      },
      {
        id: "ctx_timer_cult_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "timer_cult_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "timer_cult_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "timer_cult_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "timer_cult_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_timer_cult_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "timer_cult_project",
            type: "screen",
            feature: "timer_cult",
            route: "/projection/module?module=timer_cult",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
          },
        ],
      },
    ],
  },

  // ========== Configurar Painel de Recados (contextual) ==========
  {
    id: "ctx_message_board",
    title: "ribbon.pages.ctx_message_board",
    contextual: true,
    activeOnModules: ["message_board"],
    defaultModule: null,
    groups: [
      {
        id: "ctx_message_board_actions",
        title: "ribbon.groups.actions",
        buttons: [
          {
            id: "message_board_clear",
            icon: "mdi-stop-circle",
            label: "ribbon.btn.message_board_clear",
            action: "message_board_clear",
            color: "#e74c3c",
          },
        ],
      },
      {
        id: "ctx_message_board_format",
        title: "ribbon.groups.format",
        buttons: [
          {
            id: "message_board_toggle_format",
            icon: "mdi-format-color-fill",
            label: "ribbon.btn.format",
            action: "message_board_toggle_format",
            color: "#1b4f8a",
          },
          {
            id: "message_board_restore",
            icon: "mdi-restore",
            label: "ribbon.btn.restore",
            action: "message_board_restore",
            color: "#9b59b6",
          },
        ],
      },
      {
        id: "ctx_message_board_screen",
        title: "ribbon.groups.expanded_area",
        buttons: [
          {
            id: "message_board_project",
            type: "screen",
            feature: "message_board",
            route: "/projection/module?module=message_board",
            icon: "mdi-projector-screen-outline",
            label: "ribbon.btn.project",
            color: "#1b4f8a",
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
  timer_cult: "mdi-timer-sand",
  clock: "mdi-clock-outline",
  draw: "mdi-dice-multiple",
  name_draw: "mdi-account-multiple",
  counter: "mdi-counter",
  message_board: "mdi-message-bulleted",
  remote_control: "mdi-remote",
  theme: "mdi-palette",
  dev: "mdi-tools",
};
