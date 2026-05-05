"use strict";

/**
 * storage.js — Visibilidade e gerenciamento do armazenamento local.
 *
 * Replica o comportamento do Delphi (fmArquivosFalta + fmArquivosExcesso):
 * - stats(): tamanho ocupado por categoria (json, files, total).
 * - clearJson(): limpa cache de JSON do banco.
 * - clearFiles(): limpa toda a pasta de mídia.
 * - clearUnused(remotePaths): remove arquivos locais que não estão na lista
 *   atual do servidor (equivalente a fmArquivosExcesso).
 * - verify(remoteFiles): compara lista do servidor com local — retorna
 *   missing[] e damaged[] (tamanho diferente). Equivalente a
 *   fmArquivosFalta + integrity.diff.
 * - setFilesDir(newDir, options): move ou cria diretório custom de mídia.
 */

const fs = require("fs-extra");
const path = require("path");
const { shell } = require("electron");
const paths = require("./paths.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function _dirSize(dir) {
  if (!(await fs.pathExists(dir))) return { bytes: 0, files: 0 };
  let total = 0;
  let count = 0;
  async function walk(p) {
    const stat = await fs.stat(p);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(p);
      for (const e of entries) {
        await walk(path.join(p, e));
      }
    } else {
      total += stat.size;
      count += 1;
    }
  }
  await walk(dir);
  return { bytes: total, files: count };
}

async function _listAllFiles(dir) {
  const out = [];
  if (!(await fs.pathExists(dir))) return out;
  async function walk(p, rel) {
    const stat = await fs.stat(p);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(p);
      for (const e of entries) {
        await walk(path.join(p, e), rel ? `${rel}/${e}` : e);
      }
    } else {
      out.push({ relative: rel, size: stat.size, abs: p });
    }
  }
  await walk(dir, "");
  return out;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Retorna estatísticas de uso do armazenamento.
 * @returns {Promise<{filesDir: string, jsonDir: string, files: {bytes, count}, json: {bytes, count}, total: {bytes, count}}>}
 */
async function stats() {
  const filesDir = paths.filesDir();
  const jsonDir = paths.jsonCacheDir();
  const filesStat = await _dirSize(filesDir);
  const jsonStat = await _dirSize(jsonDir);
  return {
    filesDir,
    jsonDir,
    files: { bytes: filesStat.bytes, count: filesStat.files },
    json: { bytes: jsonStat.bytes, count: jsonStat.files },
    total: {
      bytes: filesStat.bytes + jsonStat.bytes,
      count: filesStat.files + jsonStat.files,
    },
  };
}

/** Remove todo o cache de JSON. */
async function clearJson() {
  const dir = paths.jsonCacheDir();
  await fs.remove(dir);
  await fs.ensureDir(dir);
  return { ok: true };
}

/** Remove toda a mídia local (mp3, imagens, etc.). */
async function clearFiles() {
  const dir = paths.filesDir();
  await fs.remove(dir);
  await fs.ensureDir(dir);
  return { ok: true };
}

/**
 * Compara lista de arquivos remotos com locais. Retorna:
 * - missing: presentes no servidor, faltam no disco
 * - damaged: presentes no disco mas com tamanho diferente
 * - extra: presentes no disco mas não estão na lista do servidor
 *
 * @param {Array<{remote: string, expectedSize?: number}>} remoteFiles
 * @returns {Promise<{missing, damaged, extra}>}
 */
async function verify(remoteFiles = []) {
  const filesDir = paths.filesDir();
  const remoteMap = new Map();
  for (const r of remoteFiles) {
    if (r && r.remote) remoteMap.set(r.remote.replace(/^\/+/, ""), r);
  }

  const local = await _listAllFiles(filesDir);
  const localSet = new Set(local.map((f) => f.relative));

  const missing = [];
  const damaged = [];
  for (const [rel, item] of remoteMap.entries()) {
    if (!localSet.has(rel)) {
      missing.push(item);
      continue;
    }
    const localFile = local.find((f) => f.relative === rel);
    if (item.expectedSize && localFile.size !== item.expectedSize) {
      damaged.push({ ...item, localSize: localFile.size });
    }
  }

  const extra = local
    .filter((f) => !remoteMap.has(f.relative))
    .map((f) => ({ remote: f.relative, localSize: f.size }));

  return { missing, damaged, extra };
}

/**
 * Remove arquivos locais que não estão na lista do servidor (fmArquivosExcesso).
 * @param {Array<{remote: string}>} remoteFiles
 */
async function clearUnused(remoteFiles = []) {
  const { extra } = await verify(remoteFiles);
  const filesDir = paths.filesDir();
  let removed = 0;
  for (const item of extra) {
    try {
      await fs.remove(path.join(filesDir, item.remote));
      removed += 1;
    } catch (_) {
      /* ignore */
    }
  }
  return { removed };
}

/** Abre a pasta de mídia no file explorer do SO. */
async function openFilesDir() {
  const dir = paths.filesDir();
  await fs.ensureDir(dir);
  shell.openPath(dir);
  return { ok: true, dir };
}

/**
 * Define um novo diretório de mídia. Se moveExisting=true, copia o conteúdo
 * atual para o novo local antes de trocar (e remove o antigo).
 *
 * @param {string} newDir
 * @param {object} options { moveExisting?: boolean }
 */
async function setFilesDir(newDir, options = {}) {
  const moveExisting = options.moveExisting === true;
  const oldDir = paths.filesDir();

  if (moveExisting && (await fs.pathExists(oldDir)) && oldDir !== newDir) {
    await fs.ensureDir(newDir);
    await fs.copy(oldDir, newDir, { overwrite: true });
    try {
      await fs.remove(oldDir);
    } catch (_) {
      /* ignore */
    }
  } else {
    await fs.ensureDir(newDir);
  }

  paths.setFilesDir(newDir);
  return { ok: true, dir: newDir };
}

/**
 * Auto-limpeza FIFO quando ultrapassa o limite (em bytes). Remove os
 * arquivos mais antigos primeiro até ficar abaixo do limite.
 *
 * @param {number} maxBytes
 */
async function enforceQuota(maxBytes) {
  if (!maxBytes || maxBytes <= 0) return { removed: 0 };
  const filesDir = paths.filesDir();
  const list = await _listAllFiles(filesDir);
  let total = list.reduce((s, f) => s + f.size, 0);
  if (total <= maxBytes) return { removed: 0, total };

  // Ordena por mtime (mais antigo primeiro)
  const withMtime = await Promise.all(
    list.map(async (f) => {
      const stat = await fs.stat(f.abs);
      return { ...f, mtime: stat.mtimeMs };
    })
  );
  withMtime.sort((a, b) => a.mtime - b.mtime);

  let removed = 0;
  for (const f of withMtime) {
    if (total <= maxBytes) break;
    try {
      await fs.remove(f.abs);
      total -= f.size;
      removed += 1;
    } catch (_) {
      /* ignore */
    }
  }
  return { removed, total };
}

module.exports = {
  stats,
  clearJson,
  clearFiles,
  clearUnused,
  verify,
  openFilesDir,
  setFilesDir,
  enforceQuota,
};
