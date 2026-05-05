"use strict";
const fs = require("fs-extra");
const path = require("path");
const paths = require("../paths.js");

/**
 * Verifica se um arquivo local existe e bate o tamanho esperado.
 * @param {string} localPath  Caminho absoluto OU relativo a userData/files/
 * @param {number} expectedSize  Tamanho em bytes (0 = não checar)
 * @returns {{ exists:boolean, sizeOk:boolean, actualSize:number }}
 */
function checkFile(localPath, expectedSize = 0) {
  const abs = path.isAbsolute(localPath)
    ? localPath
    : path.join(paths.userData(), "files", localPath);

  if (!fs.existsSync(abs)) return { exists: false, sizeOk: false, actualSize: 0 };

  const actualSize = fs.statSync(abs).size;
  const sizeOk = expectedSize === 0 ? true : actualSize >= expectedSize;
  return { exists: true, sizeOk, actualSize };
}

/**
 * Recebe lista de arquivos com tamanhos esperados, retorna os que precisam ser baixados.
 * @param {Array<{ remote:string, local:string, expectedSize:number }>} files
 * @returns {{ missing: Array, damaged: Array, ok: Array }}
 */
function diff(files) {
  const missing = [];
  const damaged = [];
  const ok = [];

  files.forEach((file) => {
    const check = checkFile(file.local, file.expectedSize || 0);
    if (!check.exists) {
      missing.push(file);
    } else if (!check.sizeOk) {
      damaged.push({ ...file, actualSize: check.actualSize });
    } else {
      ok.push(file);
    }
  });

  return { missing, damaged, ok };
}

module.exports = { checkFile, diff };
