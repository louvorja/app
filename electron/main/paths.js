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
   * em "Configurações → Armazenamento". Default: <Documents>/LouvorJA.
   *
   * Usar Documents (em vez de userData) porque:
   *  - é a pasta padrão que o usuário enxerga no Finder/Explorer
   *  - sobrevive a reinstalações do app (userData pode ser limpo)
   *  - replica o comportamento do Delphi original (pasta visível ao usuário)
   */
  filesDir() {
    if (_filesDirOverride) return _filesDirOverride;
    const dir = path.join(app.getPath("documents"), "LouvorJA");
    try {
      fs.ensureDirSync(dir);
    } catch (_) {
      /* permissão negada — fallback para userData */
      return path.join(app.getPath("userData"), "files");
    }
    return dir;
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

  /**
   * Caminho legado de mídia (versões antigas armazenavam em userData/files).
   * Usado apenas para migração one-shot.
   */
  legacyFilesDir() {
    return path.join(app.getPath("userData"), "files");
  },

  /** Cache JSON do banco (userData/json_db). */
  jsonCacheDir() {
    return path.join(app.getPath("userData"), "json_db");
  },
};
