/**
 * userDataStore.js — Preferências do usuário persistidas (Pinia).
 *
 * Substitui o namespace user_data do Vuex store. Contém apenas as
 * preferências do usuário; a persistência em localStorage é gerenciada
 * por UserData.js (debounce 300ms via Storage.js).
 *
 * Quem usa: UserData.js (via helper). Componentes e módulos usam
 * UserData.get/set — não importam esta store diretamente.
 */

import { defineStore } from "pinia";

// Percorre `obj` via notação de ponto e atribui `value` na folha.
function _walkSet(obj, path, value) {
  if (!path) return;
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

// Lê `obj` via notação de ponto. Retorna undefined se o path não existir.
function _walkGet(obj, path) {
  if (!path) return obj;
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result == null) return undefined;
    result = result[key];
  }
  return result;
}

export const useUserDataStore = defineStore("userData", {
  state: () => ({
    /** @type {string} Tema visual: "" (sistema) | "dark" | "light" */
    theme: "",
    /** @type {"pt"|"es"} Idioma da interface */
    language: "",
    /** @type {"apps"|"ribbon"} Layout da barra de módulos */
    layout: "apps",
    /**
     * @type {{ is_connected: boolean, url: string, token: string }}
     * Conexão com controle remoto
     */
    remote: {
      is_connected: false,
      url: "",
      token: "",
    },
    /** @type {string[]} IDs das músicas favoritas (ordem preservada) */
    favorites: [],
    /** @type {string[]} Histórico de músicas abertas (máximo 50) */
    history: [],
    /** @type {Record<string, any>} Configurações por módulo */
    modules: {
      musics: {
        search: {
          name: true,
          lyric: false,
          album: false,
          track: false,
        },
        filter: {
          instrumental_music: false,
        },
      },
      media: {
        lazy_load: true,
        fade_audio: false,
      },
    },
  }),

  getters: {
    /** Lê qualquer path dot-notation do state de user_data. */
    getData:
      (state) =>
      (path = "") =>
        _walkGet(state, path),
  },

  actions: {
    /**
     * Escreve um valor via notação de ponto dentro do state de user_data.
     * @param {string} path  Caminho dot-notation (ex: "theme", "modules.media.fade_audio").
     * @param {any}    value Valor a armazenar.
     */
    SET_PATH({ path, value }) {
      _walkSet(this, path, value);
    },
  },
});
