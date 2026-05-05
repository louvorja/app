"use strict";

/**
 * displays.js — Gerenciamento de monitores para o LouvorJA Electron (D4).
 *
 * Lista os displays conectados e persiste preferências de monitor por feature.
 */

const { screen } = require("electron");
const userStore = require("./userStore.js");

const PREF_KEY = "monitor_prefs";

/**
 * Lista todos os displays conectados, com info útil para UI.
 * @returns {Array}
 */
function list() {
  const all = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  return all.map((d, i) => ({
    id: d.id,
    label: d.id === primary.id ? `Monitor ${i + 1} (Principal)` : `Monitor ${i + 1}`,
    bounds: d.bounds,
    workArea: d.workArea,
    scaleFactor: d.scaleFactor,
    rotation: d.rotation,
    internal: d.internal,
    primary: d.id === primary.id,
    index: i,
  }));
}

/**
 * Retorna o display preferido de uma feature.
 * Se não tiver preferência salva, retorna o primary.
 * @param {string} featureId
 * @returns {Electron.Display}
 */
function getPreferred(featureId) {
  const prefs = userStore.read(PREF_KEY) || {};
  const wanted = prefs[featureId];

  if (wanted) {
    const found = screen.getAllDisplays().find((d) => d.id === wanted);
    if (found) return found;
  }

  return screen.getPrimaryDisplay();
}

/**
 * Salva preferência de display para uma feature.
 * @param {string} featureId
 * @param {number} displayId
 */
function setPreferred(featureId, displayId) {
  const prefs = userStore.read(PREF_KEY) || {};
  prefs[featureId] = displayId;
  userStore.write(PREF_KEY, prefs);
}

/**
 * Retorna todas as preferências salvas.
 * @returns {object}
 */
function getPrefs() {
  return userStore.read(PREF_KEY) || {};
}

module.exports = { list, getPreferred, setPreferred, getPrefs };
