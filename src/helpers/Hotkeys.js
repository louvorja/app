/**
 * Hotkeys.js — Centralizador de atalhos de teclado in-window.
 *
 * Replica o FormKeyUp do Delphi (fmMenu.pas) para o contexto Vue/web.
 * Complementa o Shortcuts.js (atalhos globais OS-level via Electron).
 *
 * API:
 *   Hotkeys.init()                                — attach listener global
 *   Hotkeys.destroy()                             — remove listener
 *   Hotkeys.register(combo, handler, options)     — registra atalho
 *   Hotkeys.unregister(combo, handler)            — remove handler específico
 *   Hotkeys.list()                                — retorna todos os atalhos p/ cheatsheet
 *
 * Formato de combo: "Ctrl+Shift+N", "F5", "Ctrl+ArrowUp", "Space"
 * Contextos: 'global' | 'media' | 'liturgy' | 'live' | 'edit'
 * @category helper-puro — Gerencia event listeners com primitivos JS; sem APIs Vue.
 */

// ---------------------------------------------------------------------------
// Registro interno
// ---------------------------------------------------------------------------

/** @type {Map<string, Array<{handler: Function, options: object}>>} */
const _registry = new Map();

/**
 * Normaliza um combo de teclas para uma chave canônica.
 * Ex: "ctrl+shift+n" → "Ctrl+Shift+N"
 */
function _normalizeCombo(combo) {
  const parts = combo.split("+");
  const modifiers = [];
  let key = "";

  for (const part of parts) {
    const lc = part.toLowerCase().trim();
    if (lc === "ctrl" || lc === "control") modifiers.push("Ctrl");
    else if (lc === "meta" || lc === "cmd" || lc === "command") modifiers.push("Meta");
    else if (lc === "shift") modifiers.push("Shift");
    else if (lc === "alt") modifiers.push("Alt");
    else key = part.trim().toLowerCase(); // chave sempre em minúsculas para match case-insensitive
  }

  // Ordenar modificadores em ordem canônica
  const ORDER = ["Ctrl", "Meta", "Alt", "Shift"];
  modifiers.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

  return [...modifiers, key].join("+");
}

/**
 * Deriva a chave canônica do evento de teclado.
 * Chaves de letras são normalizadas para minúsculas — Shift é capturado como modificador.
 */
function _comboFromEvent(e) {
  const modifiers = [];
  if (e.ctrlKey) modifiers.push("Ctrl");
  if (e.metaKey) modifiers.push("Meta");
  if (e.altKey) modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");

  // Normaliza para minúsculas — espelho exato de _normalizeCombo.
  // Espaço é renomeado antes do lowercase para consistência com "space" registrado.
  const rawKey = e.key === " " ? "Space" : e.key;
  const key = rawKey.toLowerCase();

  return [...modifiers, key].join("+");
}

/**
 * Verifica se o elemento focado é um campo de entrada de texto.
 */
function _focusIsInForm() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if (el.isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Handler global de keydown
// ---------------------------------------------------------------------------

function _onKeyDown(e) {
  const combo = _comboFromEvent(e);
  const handlers = _registry.get(combo);
  if (!handlers || handlers.length === 0) return;

  const inForm = _focusIsInForm();

  // Percorre do último para o primeiro (último registrado tem prioridade)
  for (let i = handlers.length - 1; i >= 0; i--) {
    const { handler, options } = handlers[i];
    const ctx = options.context || "global";

    // Ignora atalhos em campos de texto, exceto os marcados com allowInForm
    if (inForm && ctx !== "edit" && !options.allowInForm) continue;

    // Contextos especiais verificados externamente pelo handler (media/liturgy)
    // Hotkeys.js não valida se o módulo está aberto — isso é responsabilidade do handler.

    if (options.preventDefault !== false) {
      e.preventDefault();
    }
    if (options.stopPropagation) {
      e.stopPropagation();
    }

    handler(e);

    // Parar na primeira correspondência válida (último registrado vence)
    break;
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

let _initialized = false;

function init() {
  if (_initialized) return;
  window.addEventListener("keydown", _onKeyDown, { capture: true });
  _initialized = true;
  if (import.meta.env.DEV) console.log("[Hotkeys] Listener global ativo");
}

function destroy() {
  if (!_initialized) return;
  window.removeEventListener("keydown", _onKeyDown, { capture: true });
  _initialized = false;
  if (import.meta.env.DEV) console.log("[Hotkeys] Listener global removido");
}

/**
 * Registra um atalho.
 *
 * @param {string} combo           Ex: "Ctrl+K", "F5", "Space"
 * @param {Function} handler       Callback (recebe o KeyboardEvent)
 * @param {object} [options]
 * @param {string} [options.context]        'global'|'media'|'liturgy'|'live'|'edit'
 * @param {boolean} [options.preventDefault]  default: true
 * @param {boolean} [options.stopPropagation] default: false
 * @param {boolean} [options.allowInForm]     default: false
 * @param {string} [options.description]      Texto para o cheatsheet (chave i18n ou texto literal)
 * @param {string} [options.label]            Label do combo (ex: "Ctrl+K")
 * @param {string} [options.group]            Grupo para o cheatsheet
 */
function register(combo, handler, options = {}) {
  // Aceita array de combos (aliases)
  if (Array.isArray(combo)) {
    combo.forEach((c) => register(c, handler, options));
    return;
  }

  const key = _normalizeCombo(combo);
  if (!_registry.has(key)) _registry.set(key, []);

  _registry
    .get(key)
    .push({ handler, options: { context: "global", preventDefault: true, ...options } });

  if (import.meta.env.DEV)
    console.log(`[Hotkeys] Registrado: ${key} (ctx: ${options.context || "global"})`);
}

/**
 * Remove um handler específico de um combo.
 * Se handler for omitido, remove TODOS os handlers do combo.
 */
function unregister(combo, handler) {
  if (Array.isArray(combo)) {
    combo.forEach((c) => unregister(c, handler));
    return;
  }

  const key = _normalizeCombo(combo);
  if (!_registry.has(key)) return;

  if (!handler) {
    _registry.delete(key);
    return;
  }

  const list = _registry.get(key).filter((entry) => entry.handler !== handler);
  if (list.length === 0) _registry.delete(key);
  else _registry.set(key, list);
}

/**
 * Retorna todos os atalhos registrados para o cheatsheet.
 * Apenas o último handler por combo é retornado (o que vence).
 *
 * @returns {Array<{combo: string, description: string, group: string}>}
 */
function list() {
  const result = [];
  for (const [combo, handlers] of _registry.entries()) {
    if (handlers.length === 0) continue;
    const last = handlers[handlers.length - 1];
    result.push({
      combo,
      label: last.options.label || combo,
      description: last.options.description || combo,
      group: last.options.group || "general",
      context: last.options.context || "global",
    });
  }
  return result;
}

export default { init, destroy, register, unregister, list };
