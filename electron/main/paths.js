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
   * em "Configurações → Armazenamento". Default: <userData>/files.
   *
   * Por que userData (e não Documents) por padrão:
   *  - sempre escrevível — Documents pode ser bloqueado por Controlled
   *    Folder Access / Windows Defender, ou estar redirecionado pro OneDrive
   *  - sem locks de sincronização
   *  - usuário pode escolher Documents (ou qualquer pasta) em
   *    "Configurações → Armazenamento"
   *
   * Compat: se já existe `Documents/LouvorJA` de uma instalação anterior,
   * continua usando para não perder dados — só faz fallback para userData
   * em instalações novas.
   */
  filesDir() {
    if (_filesDirOverride) return _filesDirOverride;

    const userDataDir = path.join(app.getPath("userData"), "files");

    try {
      const docsDir = path.join(app.getPath("documents"), "LouvorJA");
      if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
        return docsDir;
      }
    } catch (_) {
      /* documents inacessível — segue para userData */
    }

    fs.ensureDirSync(userDataDir);
    return userDataDir;
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
   * Caminho legado de mídia (versões antigas armazenavam em userData/files
   * antes da migração para Documents). Mantido só para a migração existente
   * em main.cjs continuar compilando — pode ser removido depois.
   */
  legacyFilesDir() {
    return path.join(app.getPath("userData"), "files");
  },

  /** Cache JSON do banco (userData/json_db). */
  jsonCacheDir() {
    return path.join(app.getPath("userData"), "json_db");
  },
};
