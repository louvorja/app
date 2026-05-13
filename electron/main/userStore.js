"use strict";

/**
 * userStore.js — Persistência de dados do usuário em arquivos JSON.
 *
 * Armazena cada chave como um arquivo JSON separado em:
 *   userData/storage/<key>.json
 *
 * Regras de segurança:
 *   - Chaves são validadas por regex (sem path traversal)
 *   - Escrita atômica via arquivo .tmp + rename
 *
 * Faz parte da Fase D1 — substituição do localStorage por arquivos JSON.
 */

const fs = require("fs-extra");
const path = require("path");
const paths = require("./paths.js");

// ---------------------------------------------------------------------------
// Validação de chave
// ---------------------------------------------------------------------------

/** Regex que aceita apenas caracteres seguros para nomes de arquivo */
const KEY_RE = /^[a-zA-Z0-9_:.-]+$/;

/**
 * Valida uma chave e lança erro se inválida.
 * @param {string} key
 */
function validateKey(key) {
  if (typeof key !== "string" || key.length === 0) {
    throw new Error(`userStore: chave inválida (vazia ou não-string): ${JSON.stringify(key)}`);
  }
  if (!KEY_RE.test(key)) {
    throw new Error(
      `userStore: chave contém caracteres inválidos: "${key}". Use apenas [a-zA-Z0-9_:.-]`
    );
  }
}

// ---------------------------------------------------------------------------
// Diretório de storage
// ---------------------------------------------------------------------------

/**
 * Retorna o caminho absoluto do diretório de storage.
 * @returns {string}
 */
function storageDir() {
  return path.join(paths.userData(), "storage");
}

/**
 * Garante que o diretório de storage existe (chamado na primeira operação).
 * Chamado por init() e pelos métodos individualmente como guard.
 */
let _dirEnsured = false;
function ensureDir() {
  if (_dirEnsured) return;
  fs.ensureDirSync(storageDir());
  _dirEnsured = true;
}
// NÃO chamar ensureDir no top-level — `app` ainda não está pronto durante imports.
// As funções públicas chamam ensureDir() lazy quando necessário.

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Retorna o caminho do arquivo JSON para uma chave.
 * @param {string} key
 * @returns {string}
 */
function filePath(key) {
  return path.join(storageDir(), `${key}.json`);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Lê o valor armazenado para uma chave.
 * Retorna o objeto/valor JSON ou `null` se o arquivo não existir ou JSON inválido.
 *
 * @param {string} key
 * @returns {any | null}
 */
function read(key) {
  validateKey(key);
  const file = filePath(key);

  try {
    if (!fs.existsSync(file)) return null;
    return fs.readJsonSync(file);
  } catch (e) {
    console.warn(`[userStore] read("${key}") falhou:`, e.message);
    return null;
  }
}

/**
 * Escreve um valor para uma chave de forma atômica.
 * Usa estratégia .tmp + rename para evitar corrupção em crash.
 *
 * @param {string} key
 * @param {any} value  Qualquer valor serializável em JSON
 */
function write(key, value) {
  validateKey(key);
  ensureDir();

  const file = filePath(key);
  const tmp = `${file}.tmp`;

  try {
    fs.writeJsonSync(tmp, value, { spaces: 2 });
    fs.moveSync(tmp, file, { overwrite: true });
    if (isDev)
    console.log(`[userStore] Gravou "${key}" em ${file}`);
  } catch (e) {
    // Limpar arquivo temporário em caso de erro
    try { fs.removeSync(tmp); } catch (_) { /* ignorar */ }
    throw new Error(`[userStore] write("${key}") falhou: ${e.message}`);
  }
}

/**
 * Remove o arquivo de uma chave, se existir.
 *
 * @param {string} key
 */
function remove(key) {
  validateKey(key);
  const file = filePath(key);

  try {
    if (fs.existsSync(file)) fs.removeSync(file);
  } catch (e) {
    console.warn(`[userStore] remove("${key}") falhou:`, e.message);
  }
}

/**
 * Lista todas as chaves disponíveis no storage.
 * Retorna apenas os nomes sem extensão .json.
 *
 * @returns {string[]}
 */
function keys() {
  try {
    ensureDir();
    return fs
      .readdirSync(storageDir())
      .filter((f) => f.endsWith(".json") && !f.endsWith(".tmp.json"))
      .map((f) => f.slice(0, -5)); // remover extensão .json
  } catch (e) {
    console.warn("[userStore] keys() falhou:", e.message);
    return [];
  }
}

/**
 * Retorna o caminho absoluto do diretório de storage (útil para debug).
 *
 * @returns {string}
 */
function dir() {
  return storageDir();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { read, write, remove, keys, dir };
