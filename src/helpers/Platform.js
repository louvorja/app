/**
 * Platform.js — Adapter web/desktop para o LouvorJA.
 *
 * Detecta se a app está rodando no Electron ou no browser/PWA e expõe
 * uma API uniforme para o resto do código Vue.
 *
 * Como detectar:
 *   - No Electron: o preload.cjs injeta `window.louvorjaApi` via contextBridge
 *   - No browser/PWA: `window.louvorjaApi` é undefined
 *
 * Uso nos componentes Vue:
 *   import Platform from "@/helpers/Platform";
 *
 *   if (Platform.isDesktop) {
 *     // Código exclusivo do Electron
 *   }
 *
 * Fases futuras vão expandir este módulo:
 *   D1: Platform.userStore — storage persistente em arquivos JSON
 *   D4: Platform.windows — abrir janelas em monitores específicos
 *   D5: Platform.httpServer — servidor HTTP embarcado
 *   D6: Platform.shortcuts — atalhos globais OS-level
 * @category helper-puro — Seguro no Electron main process; sem APIs Vue.
 */

const api = typeof window !== "undefined" ? (window.louvorjaApi ?? null) : null;

export default {
  /**
   * true quando rodando dentro do Electron, false no browser/PWA.
   * Use isto como guard antes de chamar qualquer método da API.
   */
  isDesktop: !!api,

  /**
   * Referência direta à API injetada pelo preload.
   * null quando rodando no browser/PWA.
   *
   * @type {object | null}
   */
  api,

  /**
   * Plataforma do sistema operacional.
   * No browser, retorna null.
   *
   * @returns {"win32" | "darwin" | "linux" | null}
   */
  get platform() {
    return api ? api.platform : null;
  },

  /**
   * Versão do Electron em execução.
   * null quando rodando no browser/PWA.
   *
   * @returns {string | null}
   */
  get electronVersion() {
    return api ? api.version : null;
  },

  /**
   * API de storage persistente em arquivos JSON (userData/storage/).
   * Disponível apenas no Electron (D1).
   * null quando rodando no browser/PWA — Storage.js usa localStorage como fallback.
   *
   * @returns {{ read, write, remove, keys, dir } | null}
   */
  get userStore() {
    return api?.userStore ?? null;
  },

  /**
   * Controle do protocolo customizado louvorja:// (D2).
   * Permite ao renderer configurar as URLs remotas no main process.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ setRemoteConfig } | null}
   */
  get protocol() {
    return api?.protocol ?? null;
  },

  /**
   * Controle do cache JSON local em userData/json_db/ (D2).
   * null quando rodando no browser/PWA.
   *
   * @returns {{ clear, dir } | null}
   */
  get jsonCache() {
    return api?.jsonCache ?? null;
  },

  /**
   * Cliente de download FTP (D3).
   * Permite verificar conexão, baixar arquivos e monitorar progresso.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ setApiConfig, getParams, checkConnection, start, cancel, checkFiles,
   *             onProgress, onFileDone, onFileError, onQueueDone, onQueueCancelled } | null}
   */
  get download() {
    return api?.download ?? null;
  },

  /**
   * Gerenciamento de displays/monitores (D4).
   * Permite listar displays, identificá-los visualmente e salvar preferências por feature.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ list, getPreferred, setPreferred, getPrefs, identify } | null}
   */
  get displays() {
    return api?.displays ?? null;
  },

  /**
   * Gerenciamento de janelas de projeção em monitores específicos (D4).
   * Abre BrowserWindows no monitor certo com persistência de preferência.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ open, close, listOpen } | null}
   */
  get windows() {
    return api?.windows ?? null;
  },

  /**
   * Controle do servidor HTTP embarcado (D5).
   * Permite iniciar/parar o servidor e consultar status + token de auth.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ start, stop, status } | null}
   */
  get httpServer() {
    return api?.httpServer ?? null;
  },

  /**
   * Atalhos globais OS-level via globalShortcut do Electron (D6).
   * Funcionam mesmo com app minimizado ou outra janela em foco.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ enable, disable, status, savePreference, onShortcut } | null}
   */
  get shortcuts() {
    return api?.shortcuts ?? null;
  },

  /**
   * Auto-update do app via electron-updater (D8).
   * Permite verificar, baixar e instalar atualizações do app desktop.
   * null quando rodando no browser/PWA.
   *
   * @returns {{ check, download, install, status, onStateChange } | null}
   */
  get updater() {
    return api?.updater ?? null;
  },

  /**
   * Controle do powerSaveBlocker do Electron (D9.4).
   * Impede a tela de dormir/screensaver durante o modo culto.
   * null quando rodando no browser/PWA (sem efeito).
   *
   * @returns {{ start, stop, status } | null}
   */
  get powerBlocker() {
    return api?.powerBlocker ?? null;
  },

  /**
   * Controles da janela nativa (min/max/restore/close) — usado pela SystemBar.
   * null no browser/PWA.
   *
   * @returns {{ minimize, maximize, unmaximize, toggleMaximize, close, isMaximized, onMaximizeChange } | null}
   */
  get window() {
    return api?.window ?? null;
  },

  /**
   * Registra um listener para eventos emitidos pelo servidor HTTP (D5).
   * Eventos: "http:song-slides", "http:open-song", "http:drawing-number", "http:drawing-name"
   * Retorna função de cleanup. No-op no browser/PWA.
   *
   * @param {(eventType: string, data: object) => void} cb
   * @returns {() => void}
   */
  onHttpEvent(cb) {
    return api?.onHttpEvent ? api.onHttpEvent(cb) : () => {};
  },

  /**
   * Gerenciamento de armazenamento local (S2): stats, clear, verify,
   * setFilesDir, openDir, checkLocal, setAutoCache.
   * null no browser/PWA — controle só no desktop.
   */
  get storage() {
    return api?.storage ?? null;
  },

  /**
   * Iniciar com sistema operacional (F5.1).
   * { set(enabled), get() } via app.setLoginItemSettings.
   * null no browser/PWA.
   */
  get appLogin() {
    return api?.appLogin ?? null;
  },

  /**
   * Sync de UserData cross-window via IPC (fallback ao BroadcastChannel).
   * No desktop, garante que mudanças nas Opções da janela principal cheguem
   * a todas as janelas auxiliares (Projeção, Operador, ObsBible).
   * null no browser/PWA — lá o BroadcastChannel cross-tab é confiável.
   *
   * @returns {{ patch, onPatch } | null}
   */
  get userdata() {
    return api?.userdata ?? null;
  },

  /**
   * Bridge entre o BroadcastChannel local e os clients SSE remotos do
   * servidor HTTP embarcado (D5). `Broadcast.ts` chama `broadcast(msg)`
   * sempre que envia um evento relayável; o main process filtra (só aceita
   * da janela principal) e empurra para todas as conexões SSE abertas.
   *
   * null no browser/PWA — sem main process, sem encaminhamento.
   *
   * @returns {{ broadcast, onRequestState } | null}
   */
  get transmission() {
    return api?.transmission ?? null;
  },
};
