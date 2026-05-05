/**
 * Resolvers de caminhos para o main process do Electron.
 * Todos os caminhos dependem de módulos Electron, então este arquivo
 * deve ser importado SOMENTE no main process.
 */

const { app } = require("electron");
const path = require("path");
const fs = require("fs-extra");

let _filesDirOverride = null;

module.exports = {
  /** Diretório de dados do usuário (%APPDATA%/LouvorJA no Windows) */
  userData() {
    return app.getPath("userData");
  },

  /** Diretório temporário do sistema operacional */
  tempDir() {
    return app.getPath("temp");
  },

  /** Raiz da aplicação (onde está o package.json / asar) */
  appRoot() {
    return app.getAppPath();
  },

  /** Caminho para o build web (dist/) */
  webBuild() {
    return path.join(app.getAppPath(), "dist");
  },

  /**
   * Diretório de mídia (mp3, imagens, etc.). Configurável pelo usuário
   * em "Configurações → Armazenamento". Default: userData/files.
   */
  filesDir() {
    return _filesDirOverride || path.join(app.getPath("userData"), "files");
  },

  /**
   * Define um diretório customizado para a mídia. Persiste no userStore
   * (não aqui). Cria a pasta se não existir.
   */
  setFilesDir(dir) {
    if (!dir) {
      _filesDirOverride = null;
      return;
    }
    const abs = path.resolve(dir);
    fs.ensureDirSync(abs);
    _filesDirOverride = abs;
  },

  /** Cache JSON do banco (userData/json_db). */
  jsonCacheDir() {
    return path.join(app.getPath("userData"), "json_db");
  },
};
