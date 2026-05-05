/**
 * CommandRegistry — Registro central de ações (commands) do app.
 * Usado pelo Command Palette (Ctrl+K).
 *
 * Cada comando tem:
 *   - id: string único
 *   - title: label exibido
 *   - keywords: array de strings adicionais para fuzzy match
 *   - icon: mdi-icon-name
 *   - category: "action" | "module" | "music" | "hymn" | "bible" | "favorite" | "recent"
 *   - shortcut?: string (ex: "Ctrl+K") — apenas exibido, não registra
 *   - subtitle?: string — subtítulo exibido abaixo do título
 *   - run: () => void  — executa o comando
 * @category deve-virar-composable — Usa Modules (AppData) e useMedia composable.
 */

import Fuse from "fuse.js";
import Modules from "@/helpers/Modules";
import Media from "@/composables/useMedia";
import Platform from "@/helpers/Platform";

let _loaded = false;
let _commands = [];
let _fuse = null;
let _externalCommands = [];

function _buildIndex() {
  _fuse = new Fuse(_commands, {
    keys: [
      { name: "title", weight: 2 },
      { name: "keywords", weight: 1 },
      { name: "subtitle", weight: 0.5 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
}

/** Registra um comando dinâmico (ex: módulo externo) */
export function register(command) {
  _externalCommands.push(command);
  if (_loaded) {
    _commands.push(command);
    _buildIndex();
  }
}

/** Retorna true se os comandos já foram carregados */
export function isLoaded() {
  return _loaded;
}

/**
 * Busca fuzzy nos comandos carregados.
 * @param {string} query
 * @param {{ limit?: number, offset?: number, signal?: AbortSignal }} opts
 * @returns {{ results: Array, hasMore: boolean }}
 */
export function search(query, { limit = 50, offset = 0, signal } = {}) {
  if (!_fuse || !_commands.length) return { results: [], hasMore: false };
  if (signal?.aborted) return { results: [], hasMore: false };

  const raw = _fuse.search(query).map((r) => r.item);

  if (signal?.aborted) return { results: [], hasMore: false };

  return {
    results: raw.slice(offset, offset + limit),
    hasMore: raw.length > offset + limit,
  };
}

/** Comandos estáticos do sistema */
function staticCommands(t) {
  return [
    // Módulos
    {
      id: "module:liturgy",
      title: t("shell.cmd.open_liturgy"),
      keywords: ["liturgia", "culto", "programa"],
      icon: "mdi-view-list-outline",
      category: "module",
      run: () => Modules.open("liturgy"),
    },
    {
      id: "module:bible",
      title: t("shell.cmd.open_bible"),
      keywords: ["biblia", "versiculo", "scripture"],
      icon: "mdi-book-open-variant",
      category: "module",
      run: () => Modules.open("bible"),
    },
    {
      id: "module:hymnal",
      title: t("shell.cmd.open_hymnal"),
      keywords: ["hino", "hinario", "cantai"],
      icon: "mdi-music-clef-treble",
      category: "module",
      run: () => Modules.open("hymnal"),
    },
    {
      id: "module:musics",
      title: t("shell.cmd.open_musics"),
      keywords: ["musicas", "songs", "louvor"],
      icon: "mdi-music",
      category: "module",
      run: () => Modules.open("musics"),
    },
    {
      id: "module:favorites",
      title: t("shell.cmd.open_favorites"),
      keywords: ["favoritos", "estrela", "salvos"],
      icon: "mdi-star",
      category: "module",
      run: () => Modules.open("favorites"),
    },
    {
      id: "module:history",
      title: t("shell.cmd.open_history"),
      keywords: ["historico", "recentes"],
      icon: "mdi-history",
      category: "module",
      run: () => Modules.open("history"),
    },
    {
      id: "module:slide_editor",
      title: t("shell.cmd.open_slide_editor"),
      keywords: ["editor", "slides", "personalizar"],
      icon: "mdi-presentation-play",
      category: "module",
      run: () => Modules.open("slide_editor"),
    },
    {
      id: "module:transmission",
      title: t("shell.cmd.open_transmission"),
      keywords: ["transmissao", "obs", "monitor", "projecao"],
      icon: "mdi-broadcast",
      category: "module",
      run: () => Modules.open("transmission"),
    },
    {
      id: "module:downloads",
      title: t("shell.cmd.open_downloads"),
      keywords: ["download", "baixar", "coletaneas"],
      icon: "mdi-cloud-download",
      category: "module",
      run: () => Modules.open("downloads"),
    },
    {
      id: "module:update",
      title: t("shell.cmd.open_update"),
      keywords: ["update", "atualizar", "versao"],
      icon: "mdi-refresh",
      category: "module",
      run: () => Modules.open("update"),
    },

    // Ações de mídia
    {
      id: "media:close",
      title: t("shell.cmd.close_media"),
      keywords: ["fechar", "stop", "parar"],
      icon: "mdi-stop",
      category: "action",
      shortcut: "Esc",
      run: () => Media.close(true),
    },
    {
      id: "media:next",
      title: t("shell.cmd.next_slide"),
      keywords: ["proximo", "next", "avancar"],
      icon: "mdi-skip-next",
      category: "action",
      shortcut: "PgDn",
      run: () => Media.nextSlide(),
    },
    {
      id: "media:prev",
      title: t("shell.cmd.prev_slide"),
      keywords: ["anterior", "previous", "voltar"],
      icon: "mdi-skip-previous",
      category: "action",
      shortcut: "PgUp",
      run: () => Media.prevSlide(),
    },

    // Tema
    {
      id: "theme:toggle",
      title: t("shell.cmd.toggle_theme"),
      keywords: ["tema", "dark", "light", "escuro", "claro"],
      icon: "mdi-theme-light-dark",
      category: "action",
      // run é injetado na palette porque precisa de acesso ao $vuetify
      run: () => {
        // Fallback: dispara evento customizado para Shell.vue tratar
        window.dispatchEvent(new CustomEvent("louvorja:toggle-theme"));
      },
    },

    // Projeção
    {
      id: "projection:open",
      title: t("shell.cmd.open_projection"),
      keywords: ["projetar", "projection", "monitor"],
      icon: "mdi-presentation",
      category: "action",
      run: () => {
        if (Platform.isDesktop && Platform.windows) {
          Platform.windows.open({
            route: "/projection",
            feature: "shell:projection",
            fullscreen: true,
          });
        } else {
          window.open("/projection", "_blank", "noopener,noreferrer");
        }
      },
    },
    {
      id: "operator:open",
      title: t("shell.cmd.open_operator"),
      keywords: ["operador", "grade", "operator"],
      icon: "mdi-view-grid",
      category: "action",
      run: () => {
        if (Platform.isDesktop && Platform.windows) {
          Platform.windows.open({
            route: "/operator",
            feature: "shell:operator",
            fullscreen: false,
          });
        } else {
          window.open("/operator", "_blank", "noopener,noreferrer");
        }
      },
    },
  ];
}

/** Pega comandos dinâmicos: músicas, favoritos, histórico recente */
async function dynamicCommands($database, $userdata) {
  const lang = $userdata.get("language", "pt");
  const dynamic = [];

  // Favoritos
  const favorites = $userdata.get("favorites", []);
  if (Array.isArray(favorites)) {
    favorites.forEach((f) => {
      if (!f || !f.id_music) return;
      dynamic.push({
        id: `fav:${f.id_music}`,
        title: f.name || String(f.id_music),
        keywords: ["favorito"],
        icon: "mdi-star",
        category: "favorite",
        run: () => Media.open({ id_music: f.id_music, mode: "no_audio" }),
      });
    });
  }

  // Histórico (últimas 20)
  const history = $userdata.get("history", []);
  const historyList = Array.isArray(history) ? history.slice(0, 20) : [];
  historyList.forEach((h) => {
    if (!h || !h.id_music) return;
    dynamic.push({
      id: `hist:${h.id_music}`,
      title: h.name || String(h.id_music),
      keywords: ["recente", "historico"],
      icon: "mdi-history",
      category: "recent",
      run: () => Media.open({ id_music: h.id_music, mode: "no_audio" }),
    });
  });

  // Músicas (lista do banco) — pode ser grande, carrega lazy só se solicitado
  try {
    const musics = await $database.get(`${lang}_musics`);
    if (Array.isArray(musics)) {
      const limited = musics.slice(0, 5000);
      limited.forEach((m) => {
        if (!m || !m.id_music) return;
        dynamic.push({
          id: `music:${m.id_music}`,
          title: m.name || String(m.id_music),
          keywords: ["musica"],
          icon: "mdi-music-note",
          category: "music",
          subtitle: m.album || "",
          run: () =>
            Media.open({
              id_music: m.id_music,
              mode: m.has_instrumental_music ? "audio" : "no_audio",
            }),
        });
      });
    }
  } catch (e) {
    console.warn("[CommandRegistry] Falha ao carregar músicas:", e);
  }

  return dynamic;
}

/** Retorna lista completa para uso no Command Palette. Cacheia após primeira carga. */
export async function getAll($database, $userdata, t) {
  if (_loaded) return _commands;
  const stat = staticCommands(t);
  const dyn = await dynamicCommands($database, $userdata);
  _commands = [...stat, ...dyn, ..._externalCommands];
  _buildIndex();
  _loaded = true;
  return _commands;
}

export default { register, getAll, search, isLoaded };
