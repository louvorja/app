"use strict";
const ftp = require("basic-ftp");
const fs = require("fs-extra");
const path = require("path");
const { EventEmitter } = require("events");
const paths = require("../paths.js");
const handshake = require("./handshake.js");

/**
 * FtpQueue gerencia downloads sequenciais com progresso reportado via EventEmitter.
 *
 * Eventos emitidos:
 *   "progress" → { current, total, file, bytes, totalBytes }
 *   "file-done" → { file, localPath }
 *   "file-error" → { file, error }
 *   "queue-done" → { downloaded, failed }
 *   "queue-cancelled"
 */
class FtpQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.running = false;
    this.cancelled = false;
    this.paused = false;
    this.client = null;
    this._creds = null;
    this._credsExpiry = 0;
    this._resumeWaiters = [];
  }

  /**
   * Adiciona arquivos à fila. Cada item: { remote: "/path/no/ftp.mp3", local: "/path/local.mp3" }
   * Se local não for absoluto, é relativo a userData/files/.
   */
  add(items) {
    items.forEach((item) => {
      const localAbs = path.isAbsolute(item.local)
        ? item.local
        : path.join(paths.userData(), "files", item.local);
      this.queue.push({ remote: item.remote, local: localAbs, expectedSize: item.expectedSize });
    });
  }

  cancel() {
    this.cancelled = true;
    this.paused = false;
    this._resumeWaiters.forEach((res) => res());
    this._resumeWaiters = [];
    if (this.client) {
      try { this.client.close(); } catch (_) { /* ignore */ }
    }
  }

  pause() {
    if (!this.running) return;
    this.paused = true;
    this.emit("paused");
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._resumeWaiters.forEach((res) => res());
    this._resumeWaiters = [];
    this.emit("resumed");
  }

  _waitIfPaused() {
    if (!this.paused) return Promise.resolve();
    return new Promise((res) => this._resumeWaiters.push(res));
  }

  async _getCredentials() {
    // Renovar credenciais se expiraram (5 minutos de validade conservadora)
    const now = Date.now();
    if (this._creds && now < this._credsExpiry) return this._creds;

    this._creds = await handshake.getFtpCredentials({ lang: "PT" });
    this._credsExpiry = now + 5 * 60 * 1000;
    return this._creds;
  }

  /**
   * Inicia processamento da fila. Conecta FTP uma única vez para todos os downloads.
   */
  async start() {
    if (this.running) throw new Error("FtpQueue já está em execução");
    if (this.queue.length === 0) {
      this.emit("queue-done", { downloaded: 0, failed: 0 });
      return;
    }

    this.running = true;
    this.cancelled = false;

    let downloaded = 0;
    let failed = 0;
    const total = this.queue.length;

    try {
      const creds = await this._getCredentials();

      this.client = new ftp.Client();
      this.client.ftp.verbose = false;

      await this.client.access({
        host: creds.host,
        port: creds.port,
        user: creds.username,
        password: creds.password,
        secure: false, // FTP plain — Delphi também usa
      });

      // O servidor faz chroot — após login o usuário cai numa "home" e
      // qualquer path com leading "/" é interpretado como raiz absoluta
      // do filesystem (que retorna 550). Estratégia: passar path relativo
      // ao home no RETR, sem cd. O `creds.root`, se vier preenchido, vira
      // prefixo dentro do mesmo home (concatenado e ainda relativo).
      const root = (creds.root || "").replace(/^\/+|\/+$/g, "");
      const buildRel = (remote) => {
        const rel = remote.replace(/^\/+/, "");
        return root ? `${root}/${rel}` : rel;
      };

      while (this.queue.length > 0 && !this.cancelled) {
        // Aguarda se pausado (sem fechar a conexão FTP)
        await this._waitIfPaused();
        if (this.cancelled) break;

        const item = this.queue.shift();
        const idx = total - this.queue.length;
        const remotePath = buildRel(item.remote);

        try {
          await fs.ensureDir(path.dirname(item.local));

          // Track progress por bytes
          this.client.trackProgress((info) => {
            this.emit("progress", {
              current: idx,
              total,
              file: item.remote,
              bytes: info.bytes,
              totalBytes: item.expectedSize ?? 0,
            });
          });

          // Download para .tmp + rename
          const tmp = `${item.local}.tmp`;
          try {
            await this.client.downloadTo(tmp, remotePath);
            await fs.move(tmp, item.local, { overwrite: true });
            this.emit("file-done", { file: item.remote, localPath: item.local });
            downloaded++;
          } finally {
            // Desliga o progress tracker MESMO em caso de falha — sem isso,
            // o callback ficava ativo e cada download seguinte registrava um
            // novo, acumulando handlers por arquivo falhado.
            try { this.client.trackProgress(); } catch (_) { /* ignore */ }
          }
        } catch (err) {
          console.warn(`[ftpQueue] falhou ${remotePath}: ${err.message}`);
          this.emit("file-error", { file: item.remote, error: err.message });
          failed++;
        }
      }
    } catch (err) {
      this.emit("file-error", { file: "(connection)", error: err.message });
    } finally {
      try { this.client?.close(); } catch (_) { /* ignore */ }
      this.client = null;
      this.running = false;
    }

    if (this.cancelled) {
      this.emit("queue-cancelled");
    } else {
      this.emit("queue-done", { downloaded, failed });
    }
  }
}

module.exports = { FtpQueue };
