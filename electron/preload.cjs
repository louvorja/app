"use strict";

/**
 * Preload script do LouvorJA Electron.
 *
 * Este script roda em contexto isolado (contextIsolation: true) e é responsável
 * por expor uma API segura ao renderer via contextBridge.
 *
 * API exposta: window.louvorjaApi
 *
 * Fases posteriores vão adicionar mais métodos aqui conforme os IPC handlers
 * forem implementados no main process:
 *   - D1: userStore (read/write/atomicSwap)
 *   - D2: jsonCache, protocol
 *   - D3: ftpDownload, downloadProgress
 *   - D4: windows (open, close, identify)
 *   - D5: httpServer (start/stop, getUrl)
 *   - D6: shortcuts (register/unregister)
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("louvorjaApi", {
  /** Versão do Electron em execução */
  version: process.versions.electron,

  /** Plataforma do sistema operacional: "win32" | "darwin" | "linux" */
  platform: process.platform,

  /**
   * Sentinela para o Platform.js adapter detectar se está rodando no Electron.
   * No browser/PWA, window.louvorjaApi não existe (undefined), então isDesktop = false.
   */
  isDesktop: true,

  // -------------------------------------------------------------------------
  // IPC helpers internos para fases futuras.
  // Não use ipcRenderer diretamente no renderer — sempre passe por aqui.
  // -------------------------------------------------------------------------

  /**
   * Invoca um handler IPC no main process e aguarda a resposta.
   * Wrapper genérico para ipcRenderer.invoke().
   * Usado pelas fases D1-D6 para chamar serviços do main.
   *
   * @param {string} channel  Nome do canal IPC (ex: "userStore:read")
   * @param {...any} args     Argumentos a passar ao handler
   * @returns {Promise<any>}
   */
  invoke(channel, ...args) {
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * Escuta eventos emitidos pelo main process via webContents.send().
   * Retorna função de cleanup (remove o listener).
   *
   * @param {string} channel
   * @param {Function} handler
   * @returns {Function} cleanup
   */
  on(channel, handler) {
    const wrappedHandler = (_event, ...args) => handler(...args);
    ipcRenderer.on(channel, wrappedHandler);
    return () => ipcRenderer.off(channel, wrappedHandler);
  },

  // -------------------------------------------------------------------------
  // D1 — Storage persistente em arquivos JSON (userData/storage/)
  // -------------------------------------------------------------------------

  userStore: {
    /** Lê o valor de uma chave (retorna null se não existir) */
    read: (key) => ipcRenderer.invoke("userStore:read", key),
    /** Escreve o valor de uma chave de forma atômica */
    write: (key, value) => ipcRenderer.invoke("userStore:write", key, value),
    /** Remove o arquivo de uma chave */
    remove: (key) => ipcRenderer.invoke("userStore:remove", key),
    /** Lista todas as chaves disponíveis */
    keys: () => ipcRenderer.invoke("userStore:keys"),
    /** Retorna o caminho absoluto do diretório de storage (debug) */
    dir: () => ipcRenderer.invoke("userStore:dir"),
  },

  /**
   * Sync de UserData entre janelas via IPC (fallback determinístico ao
   * BroadcastChannel cross-process). O renderer chama `patch()` quando o
   * usuário muda uma opção, o main reemite via webContents.send para todas
   * as outras BrowserWindows, e elas processam em `onPatch()`.
   */
  userdata: {
    /**
     * Notifica o main que o renderer aplicou um patch — main fan-out para
     * as outras janelas.
     * @param {{ path: string, value: unknown, _src?: string }} payload
     */
    patch: (payload) => ipcRenderer.invoke("userdata:patch", payload),

    /**
     * Registra listener para patches vindos de outras janelas.
     * @param {(payload: { path: string, value: unknown, _src?: string }) => void} cb
     * @returns {() => void} cleanup
     */
    onPatch: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("userdata:patch", handler);
      return () => ipcRenderer.off("userdata:patch", handler);
    },
  },

  // -------------------------------------------------------------------------
  // D2 — Protocolo customizado louvorja:// e cache JSON
  // -------------------------------------------------------------------------

  protocol: {
    /**
     * Atualiza as URLs remotas no main process para o protocolo louvorja://.
     * Deve ser chamado logo após montar o app, passando as variáveis VITE_URL_DATABASE,
     * VITE_URL_FILES e VITE_API_TOKEN.
     *
     * @param {{ databaseUrl: string, filesUrl: string, apiToken: string }} cfg
     */
    setRemoteConfig: (cfg) => ipcRenderer.invoke("protocol:setRemoteConfig", cfg),
  },

  jsonCache: {
    /** Limpa todo o cache JSON em userData/json_db/ */
    clear: () => ipcRenderer.invoke("jsonCache:clear"),
    /** Retorna o caminho do diretório de cache (debug / módulo update) */
    dir: () => ipcRenderer.invoke("jsonCache:dir"),
  },

  // -------------------------------------------------------------------------
  // D3 — Download FTP de mídia
  // -------------------------------------------------------------------------

  download: {
    /** Atualiza configuração da API de download */
    setApiConfig: (cfg) => ipcRenderer.invoke("download:setApiConfig", cfg),
    /** Busca params da API (com cache TTL diário). force=true força refetch. */
    getParams: (force) => ipcRenderer.invoke("download:getParams", force),
    /** Verifica conexão FTP fazendo handshake real com o servidor */
    checkConnection: () => ipcRenderer.invoke("download:checkConnection"),
    /** Inicia download de uma lista de arquivos */
    start: (files) => ipcRenderer.invoke("download:start", files),
    /** Cancela o download em andamento */
    cancel: () => ipcRenderer.invoke("download:cancel"),
    /** Pausa o download (mantém conexão FTP). */
    pause: () => ipcRenderer.invoke("download:pause"),
    /** Retoma um download pausado. */
    resume: () => ipcRenderer.invoke("download:resume"),
    /** True se houver download em andamento. */
    isDownloading: () => ipcRenderer.invoke("download:isDownloading"),
    /** Verifica integridade local de uma lista de arquivos */
    checkFiles: (files) => ipcRenderer.invoke("download:checkFiles", files),

    // Eventos de progresso — retornam função de cleanup (off listener)
    onProgress: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("download:progress", handler);
      return () => ipcRenderer.off("download:progress", handler);
    },
    onFileDone: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("download:file-done", handler);
      return () => ipcRenderer.off("download:file-done", handler);
    },
    onFileError: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("download:file-error", handler);
      return () => ipcRenderer.off("download:file-error", handler);
    },
    onQueueDone: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("download:queue-done", handler);
      return () => ipcRenderer.off("download:queue-done", handler);
    },
    onQueueCancelled: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("download:queue-cancelled", handler);
      return () => ipcRenderer.off("download:queue-cancelled", handler);
    },
  },

  // -------------------------------------------------------------------------
  // D4 — Gerenciamento de monitores e janelas de projeção
  // -------------------------------------------------------------------------

  displays: {
    /** Lista todos os displays conectados com metadata (id, label, bounds, primary, ...) */
    list: () => ipcRenderer.invoke("displays:list"),
    /** Retorna o display preferido de uma feature {id, bounds} */
    getPreferred: (feature) => ipcRenderer.invoke("displays:getPreferred", feature),
    /** Salva preferência de display para uma feature */
    setPreferred: (feature, displayId) => ipcRenderer.invoke("displays:setPreferred", feature, displayId),
    /** Retorna todas as preferências salvas de monitor por feature */
    getPrefs: () => ipcRenderer.invoke("displays:getPrefs"),
    /** Mostra overlays de identificação em todos os monitores por durationMs */
    identify: (durationMs) => ipcRenderer.invoke("displays:identify", durationMs),
  },

  windows: {
    /** Abre janela de projeção em monitor específico. Retorna { id } da BrowserWindow. */
    open: (options) => ipcRenderer.invoke("windows:open", options),
    /** Fecha a janela de uma feature, se estiver aberta */
    close: (feature) => ipcRenderer.invoke("windows:close", feature),
    /** Lista features com janelas abertas */
    listOpen: () => ipcRenderer.invoke("windows:listOpen"),
    /** Liga/desliga always-on-top de uma janela aberta */
    setAlwaysOnTop: (feature, on) =>
      ipcRenderer.invoke("windows:setAlwaysOnTop", feature, on),
  },

  // F5.1 — Iniciar com o sistema operacional
  appLogin: {
    set: (enabled) => ipcRenderer.invoke("app:setLoginItem", enabled),
    get: () => ipcRenderer.invoke("app:getLoginItem"),
  },

  // S2 — Armazenamento (visibilidade + gerenciamento)
  storage: {
    /** Estatísticas: tamanho ocupado por categoria + caminhos. */
    stats: () => ipcRenderer.invoke("storage:stats"),
    /** Limpa cache de JSON (banco). */
    clearJson: () => ipcRenderer.invoke("storage:clearJson"),
    /** Limpa toda a mídia local (mp3, imagens). */
    clearFiles: () => ipcRenderer.invoke("storage:clearFiles"),
    /** Remove arquivos locais que não estão na lista do servidor. */
    clearUnused: (remoteFiles) => ipcRenderer.invoke("storage:clearUnused", remoteFiles),
    /** Compara servidor vs local — retorna { missing, damaged, extra }. */
    verify: (remoteFiles) => ipcRenderer.invoke("storage:verify", remoteFiles),
    /** Abre a pasta de mídia no explorer do SO. */
    openDir: () => ipcRenderer.invoke("storage:openDir"),
    /** Mostra dialog de seleção de pasta. */
    chooseDir: () => ipcRenderer.invoke("storage:chooseDir"),
    /** Define nova pasta de mídia (com opção de mover conteúdo). */
    setFilesDir: (newDir, opts) => ipcRenderer.invoke("storage:setFilesDir", newDir, opts),
    /** Auto-limpeza FIFO ao ultrapassar maxBytes. */
    enforceQuota: (maxBytes) => ipcRenderer.invoke("storage:enforceQuota", maxBytes),
    /** Verifica quais arquivos remotos já estão no disco. */
    checkLocal: (remotePaths) => ipcRenderer.invoke("storage:checkLocal", remotePaths),
    /** Liga/desliga auto-cache ao reproduzir mídia. */
    setAutoCache: (enabled) => ipcRenderer.invoke("storage:setAutoCache", enabled),
  },

  // -------------------------------------------------------------------------
  // D5 — Servidor HTTP embarcado
  // -------------------------------------------------------------------------

  httpServer: {
    /** Inicia o servidor HTTP. Retorna { port, token }. */
    start: (opts) => ipcRenderer.invoke("httpServer:start", opts),
    /** Para o servidor HTTP. */
    stop: () => ipcRenderer.invoke("httpServer:stop"),
    /** Retorna { running, port, token, sse }. */
    status: () => ipcRenderer.invoke("httpServer:status"),
    /** Retorna lista de IPs IPv4 locais (não-loopback). */
    localIps: () => ipcRenderer.invoke("httpServer:localIps"),
    /** Regenera token (revoga acessos antigos). Retorna novo token. */
    resetToken: () => ipcRenderer.invoke("httpServer:resetToken"),
  },

  /**
   * Encaminha mensagens do BroadcastChannel local para os clients SSE
   * conectados ao servidor HTTP (OBS, celular, navegador remoto).
   * Chamado apenas pela janela principal — `Broadcast.ts` faz isso
   * automaticamente. Em janelas auxiliares vira no-op no main process.
   *
   * Usa `send` (one-way) em vez de `invoke` para não bloquear o emissor
   * em cada slide_change — a entrega via SSE é fire-and-forget.
   */
  transmission: {
    broadcast: (msg) => ipcRenderer.send("transmission:broadcast", msg),

    /**
     * Disparado pelo main process quando o servidor sobe — pede ao
     * renderer que reemita REQUEST_*_STATE para que slide/versículo/valor
     * de módulo atual seja capturado e enviado aos clients SSE recém-
     * conectados. Sem isso, ligar o servidor com música já tocando
     * deixava o cliente em branco até a próxima troca.
     */
    onRequestState(cb) {
      const handler = () => cb();
      ipcRenderer.on("transmission:request-state", handler);
      return () => ipcRenderer.off("transmission:request-state", handler);
    },
  },

  // -------------------------------------------------------------------------
  // D6 — Atalhos globais OS-level (globalShortcut)
  // -------------------------------------------------------------------------

  shortcuts: {
    /** Registra os Media keys globais. Retorna { ok, registered, failed }. */
    enable: () => ipcRenderer.invoke("shortcuts:enable"),
    /** Desregistra todos os atalhos globais. Retorna { ok }. */
    disable: () => ipcRenderer.invoke("shortcuts:disable"),
    /** Retorna { enabled, registered }. */
    status: () => ipcRenderer.invoke("shortcuts:status"),
    /** Persiste a preferência no userStore (auto-enable no próximo boot). */
    savePreference: (enabled) => ipcRenderer.invoke("shortcuts:savePreference", enabled),

    /**
     * Escuta ações de atalho despachadas pelo main process.
     * Chamado pelo Shortcuts.js no renderer.
     *
     * @param {(data: { action: string, payload: object }) => void} cb
     * @returns {() => void} cleanup
     */
    onShortcut(cb) {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("shortcut", handler);
      return () => ipcRenderer.off("shortcut", handler);
    },
  },

  // -------------------------------------------------------------------------
  // Window controls — minimize/maximize/restore/close + isMaximized event
  // -------------------------------------------------------------------------

  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    unmaximize: () => ipcRenderer.invoke("window:unmaximize"),
    toggleMaximize: () => ipcRenderer.invoke("window:toggleMaximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
    /**
     * Escuta o evento "maximize"/"unmaximize" enviado pelo main quando o estado da
     * janela muda (ex: usuário arrasta para tela ou clica no controle nativo).
     * Retorna função de cleanup.
     */
    onMaximizeChange(cb) {
      const handler = (_e, isMax) => cb(!!isMax);
      ipcRenderer.on("window:maximizeChange", handler);
      return () => ipcRenderer.off("window:maximizeChange", handler);
    },
  },

  // -------------------------------------------------------------------------
  // D9.4 — Power Save Blocker (impede tela dormir durante modo culto)
  // -------------------------------------------------------------------------

  powerBlocker: {
    /** Inicia o bloqueio de power save. Retorna { ok, id, alreadyStarted? }. */
    start: () => ipcRenderer.invoke("powerBlocker:start"),
    /** Para o bloqueio de power save. Retorna { ok }. */
    stop: () => ipcRenderer.invoke("powerBlocker:stop"),
    /** Retorna { active, id }. */
    status: () => ipcRenderer.invoke("powerBlocker:status"),
  },

  // -------------------------------------------------------------------------
  // D8 — Auto-update do app via electron-updater
  // -------------------------------------------------------------------------

  updater: {
    /** Verifica manualmente se há nova versão. Retorna { ok, state, error? }. */
    check: () => ipcRenderer.invoke("updater:check"),
    /** Inicia o download da atualização disponível. Retorna { ok, error? }. */
    download: () => ipcRenderer.invoke("updater:download"),
    /** Fecha o app e instala a atualização baixada. */
    install: () => ipcRenderer.invoke("updater:install"),
    /** Retorna o estado atual do updater (snapshot). */
    status: () => ipcRenderer.invoke("updater:status"),

    /**
     * Escuta mudanças de estado do updater enviadas pelo main process.
     * O main faz webContents.send("updater:state", state) sempre que o estado muda.
     *
     * @param {(state: object) => void} cb
     * @returns {() => void} cleanup
     */
    onStateChange(cb) {
      const handler = (_e, state) => cb(state);
      ipcRenderer.on("updater:state", handler);
      return () => ipcRenderer.off("updater:state", handler);
    },
  },

  /**
   * Registra um callback para eventos emitidos pelo servidor HTTP ao renderer.
   * Eventos: "http:song-slides", "http:open-song", "http:drawing-number", "http:drawing-name"
   * Retorna função de cleanup que remove todos os listeners.
   *
   * @param {(eventType: string, data: object) => void} cb
   * @returns {() => void} cleanup
   */
  onHttpEvent(cb) {
    const events = [
      "http:song-slides",
      "http:open-song",
      "http:drawing-number",
      "http:drawing-name",
    ];
    const handlers = events.map((evt) => {
      const handler = (_e, data) => cb(evt, data);
      ipcRenderer.on(evt, handler);
      return [evt, handler];
    });
    return () => handlers.forEach(([evt, h]) => ipcRenderer.off(evt, h));
  },
});
