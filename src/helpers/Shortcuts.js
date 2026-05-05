/**
 * Shortcuts.js — Roteamento de atalhos no renderer (D6).
 *
 * Recebe ações despachadas pelo main process via globalShortcut e as
 * traduz para operações nos helpers do app — substitui o FormKeyUp do Delphi.
 *
 * Diferença de Hotkeys.js (atalhos in-window):
 * - Hotkeys.js:    atalhos in-window (só quando a janela do app está em foco)
 * - Shortcuts.js:  recebe globalShortcut system-wide (app pode estar em background)
 *
 * No browser/PWA, init() e destroy() são no-op.
 * @category helper-puro — Sem APIs Vue; no-op fora do Electron.
 */

import Media from "@/composables/useMedia";
import AppData from "@/helpers/AppData";
import Platform from "@/helpers/Platform";

/** @type {(() => void) | null} — cleanup do listener de IPC */
let _unlisten = null;

/**
 * Roteia ações de atalho para os helpers apropriados.
 * Pode ser chamado tanto pelo listener de IPC (D6) quanto diretamente
 * por componentes que queiram reutilizar o roteamento.
 *
 * @param {string} action   Ex: "slide:next", "audio:toggle"
 * @param {object} [payload]
 */
function dispatchAction(action, payload = {}) {
  switch (action) {
    case "slide:next":
      Media.nextSlide();
      break;

    case "slide:prev":
      Media.prevSlide();
      break;

    case "slide:first":
      Media.firstSlide();
      break;

    case "slide:last":
      Media.lastSlide();
      break;

    case "audio:toggle": {
      // Toggle play/pause baseado no estado atual do player
      const isPaused = AppData.get("modules.media.config.is_paused");
      if (isPaused) {
        Media.play();
      } else {
        Media.pause();
      }
      break;
    }

    case "media:close":
      Media.close(true);
      break;

    default:
      console.warn(`[Shortcuts] Ação desconhecida: "${action}"`, payload);
  }
}

/**
 * Inicializa o listener de atalhos globais do Electron.
 * No web/PWA é no-op (Platform.shortcuts === null).
 * Idempotente: chamadas repetidas são ignoradas.
 */
function init() {
  if (_unlisten) return; // já inicializado
  if (!Platform.isDesktop || !Platform.shortcuts) return;

  _unlisten = Platform.shortcuts.onShortcut(({ action, payload }) => {
    dispatchAction(action, payload);
  });

  if (import.meta.env.DEV) console.log("[Shortcuts] Listener de atalhos globais ativo");
}

/**
 * Remove o listener de atalhos globais.
 * Chamado pelo App.vue ao desmontar (cleanup).
 */
function destroy() {
  if (_unlisten) {
    _unlisten();
    _unlisten = null;
    if (import.meta.env.DEV) console.log("[Shortcuts] Listener de atalhos globais removido");
  }
}

export default { init, destroy, dispatchAction };
