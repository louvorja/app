/**
 * UserData.js — Preferências do usuário com persistência automática.
 *
 * Responsabilidade: wrapper sobre AppData para o namespace `user_data`.
 * Toda leitura/escrita passa por AppData (que vai ao Vuex store) e as
 * escritas disparam um save com debounce de 300ms para não sobrecarregar
 * o Storage durante interações rápidas (ex: arrastar controle deslizante).
 *
 * Quem usa: componentes e módulos que precisam ler ou salvar preferências
 * do usuário (tema, idioma, favoritos, configurações de módulo, etc.).
 *
 * Fluxo completo de uma escrita:
 *   UserData.set("theme", "dark")
 *     → AppData.set("user_data.theme", "dark")
 *       → store.commit("SET_USER_DATA_PATH", { path: "theme", value: "dark" })
 *         → state.user_data.theme = "dark"
 *     → UserData.save() [debounce 300ms]
 *       → Storage.set("user_data", { theme: "dark", ... })
 */

/**
 * @typedef {object} UserDataState
 * @property {string}                theme     Tema visual: "" (sistema) | "dark" | "light".
 * @property {"pt"|"es"}            language  Idioma da interface.
 * @property {"apps"|"ribbon"}      layout    Layout da barra de módulos.
 * @property {RemoteConfig}          remote    Conexão com controle remoto.
 * @property {string[]}              favorites IDs das músicas favoritas (ordem preservada).
 * @property {string[]}              history   Histórico de músicas abertas (máximo 50).
 * @property {Record<string, any>}  modules   Configurações por módulo (search, filter, etc.).
 */

/**
 * @typedef {object} RemoteConfig
 * @property {boolean} is_connected Indica se o controle remoto está conectado.
 * @property {string}  url         URL do servidor de controle remoto.
 * @property {string}  token       Token de autenticação do controle remoto.
 */

import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";

let _saveTimer = null;

export default {
  /**
   * Persiste o estado completo de `user_data` no Storage.
   *
   * Usa debounce de 300ms para agrupar múltiplas escritas consecutivas
   * numa única operação de I/O — importante em interações de drag-and-drop
   * e sliders que disparam dezenas de eventos por segundo.
   */
  save() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      $dev.write("salvando dados");
      $storage.set("user_data", $appdata.get("user_data"));
    }, 300);
  },

  /**
   * Carrega as preferências salvas do Storage para o store.
   * Chamado uma vez no boot, antes de montar o app.
   */
  load() {
    $dev.write("carregando dados");
    let data = $appdata.flatten($storage.get("user_data"));

    Object.keys(data).map((item) => {
      $appdata.set(`user_data.${item}`, data[item]);
    });
  },

  /**
   * Escreve uma preferência do usuário e agenda persistência.
   *
   * @param {string} param  Campo dentro de `user_data` (ex: "theme", "modules.media.fade_audio").
   * @param {any}    value  Valor a armazenar.
   */
  set(param, value) {
    $dev.write("set userdata", { param, value });
    $appdata.set(`user_data.${param}`, value);

    this.save();
  },

  /**
   * Escreve uma preferência apenas se ela ainda não foi definida (null ou undefined).
   * Útil para inicializar valores padrão sem sobrescrever configurações existentes.
   *
   * Nota: não dispara save — use `set()` quando precisar persistir.
   *
   * @param {string} param  Campo dentro de `user_data`.
   * @param {any}    value  Valor padrão.
   */
  setIfNull(param, value) {
    $dev.write("set userdata", { param, value });
    if (
      $appdata.get(`user_data.${param}`) === null ||
      $appdata.get(`user_data.${param}`) === undefined
    ) {
      $appdata.set(`user_data.${param}`, value);
    }
  },

  /**
   * Lê uma preferência do usuário.
   *
   * @param {string} [param]   Campo dentro de `user_data`. Se omitido, retorna o objeto inteiro.
   * @param {any}    [ifnull]  Valor padrão quando o campo não existe.
   * @returns {any}
   */
  get(param, ifnull = null) {
    if (!param) {
      return $appdata.get("user_data", ifnull);
    }
    return $appdata.get(`user_data.${param}`, ifnull);
  },
};
