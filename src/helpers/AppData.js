/**
 * AppData.js — Estado volátil de sessão do LouvorJA.
 *
 * Responsabilidade: camada de leitura/escrita sobre os stores Pinia usando
 * notação de ponto (dot-notation). Os dados vivem apenas na memória da
 * sessão atual — não persistem entre reloads.
 *
 * Stores usados:
 *   - appStore  — estado de app (flags, módulos, alert, popup, etc.)
 *   - userDataStore — preferências do usuário (tema, idioma, favoritos, etc.)
 *
 * Quem usa: helpers internos (UserData.js, Alert.js, Popup.js, etc.) e
 * composables. Componentes e módulos NÃO devem importar AppData diretamente
 * — use UserData para preferências persistidas ou composables do store.
 *
 * Sincronização cross-window: toda chamada a `set()` propaga a mudança para
 * a janela popup aberta (se houver) via `window.postMessage`. Isso mantém o
 * estado consistente entre a janela principal e janelas popup de módulos.
 *
 * Camadas de estado:
 *   AppData.set("user_data.theme", "dark")
 *     → userDataStore.SET_PATH({ path: "theme", value: "dark" })
 *       → state.theme = "dark"
 *         → Storage.set("user_data", ...) [via UserData.save, debounce 300ms]
 */

import { useAppStore } from "@/stores/appStore";
import { useUserDataStore } from "@/stores/userDataStore";

// Caminhos de primeiro nível que mapeiam 1:1 para uma action nomeada do appStore.
const _SCALAR_ACTIONS = {
  loading: "SET_LOADING",
  is_dark: "SET_IS_DARK",
  is_dev: "SET_IS_DEV",
  is_popup: "SET_IS_POPUP",
  is_mobile: "SET_IS_MOBILE",
  is_desktop: "SET_IS_DESKTOP",
  is_online: "SET_IS_ONLINE",
  import_modules: "SET_IMPORT_MODULES",
  popup: "SET_POPUP",
  popup_module: "SET_POPUP_MODULE",
  module_group: "SET_MODULE_GROUP",
};

export default {
  /**
   * Escreve um valor no estado da sessão.
   *
   * Roteia para a action Pinia mais específica disponível. Paths que começam
   * com `user_data.` vão para userDataStore; os demais vão para appStore.
   *
   * Após cada escrita, sincroniza a janela popup aberta via postMessage —
   * exceto para os campos `popup`, `is_popup` e `is_fullscreen`, que
   * controlariam loops de sincronização.
   *
   * @param {string} param  Caminho dot-notation (ex: "user_data.theme", "loading").
   * @param {any}    value  Valor a armazenar.
   */
  set(param, value) {
    const parts = param.split(".");
    const root = parts[0];

    if (root === "user_data") {
      const ud = useUserDataStore();
      if (parts.length === 1) {
        // Substitui o state inteiro de user_data (ex: load inicial).
        ud.$patch(value);
      } else {
        const path = parts.slice(1).join(".");
        ud.SET_PATH({ path, value });
      }
    } else if (_SCALAR_ACTIONS[root] && parts.length === 1) {
      // Scalar top-level flag — action nomeada direta.
      useAppStore()[_SCALAR_ACTIONS[root]](value);
    } else if (root === "alert") {
      // alert.<key> = value
      useAppStore().PATCH_ALERT({ key: parts[1], value });
    } else if (root === "modules" && parts.length >= 2) {
      // modules.<id>[.<path>] = value
      const id = parts[1];
      const path = parts.slice(2).join(".");
      useAppStore().SET_MODULE_PATH({ id, path, value });
    } else {
      // Fallback deprecated — caminhos desconhecidos ou compostos.
      useAppStore().setData([...parts, value]);
    }

    // Sincroniza popup quando appdata muda (mantém estado entre janelas).
    const popup = this.get("popup");
    if (popup && param != "popup" && param != "is_popup" && param != "is_fullscreen") {
      if (popup.closed) {
        this.set("popup", null);
      } else {
        try {
          popup.postMessage({ param, value }, window.location.origin);
        } catch (e) {
          console.log(e);
        }
      }
    }
  },

  /**
   * Lê um valor do estado da sessão.
   *
   * @param {string} param    Caminho dot-notation. Se omitido, retorna o state mesclado (app + user_data).
   * @param {any}    ifnull   Valor padrão quando o path não existe.
   * @returns {any}
   */
  get(param, ifnull = null) {
    if (!param) {
      // Retorna state completo (appStore + userDataStore) para serialização/popup sync.
      const app = useAppStore();
      const ud = useUserDataStore();
      return { ...app.$state, user_data: ud.$state };
    }

    const parts = param.split(".");
    const root = parts[0];

    if (root === "user_data") {
      const ud = useUserDataStore();
      if (parts.length === 1) return ud.$state;
      const path = parts.slice(1).join(".");
      const result = ud.getData(path);
      return result === undefined ? ifnull : result;
    }

    const store = useAppStore();
    if (!store.exists(param)) return ifnull;
    return store.getData(param);
  },

  /**
   * Retorna o state serializado e achatado em notação de ponto.
   * Remove `popup` e `is_popup` (não serializáveis via postMessage).
   *
   * @returns {Record<string, any>}
   */
  getFlatten() {
    let data = Object.assign({}, this.get());
    delete data.popup;
    delete data.is_popup;
    data = JSON.parse(JSON.stringify(data));
    return this.flatten(data);
  },

  /**
   * Adiciona um elemento a um array no estado.
   *
   * @param {string} param  Caminho dot-notation para o array.
   * @param {any}    value  Elemento a adicionar.
   */
  addElement(param, value) {
    useAppStore().addElementArray([param, value]);
  },

  /**
   * Remove um elemento de um array no estado (por igualdade de valor).
   *
   * @param {string} param  Caminho dot-notation para o array.
   * @param {any}    value  Elemento a remover.
   */
  removeElement(param, value) {
    useAppStore().removeElementArray([param, value]);
  },

  /**
   * Inverte o valor booleano de um campo.
   *
   * @param {string} param  Caminho dot-notation.
   */
  toggle(param) {
    this.set(param, !this.get(param));
  },

  /** @deprecated Use `toggle` (correct spelling). Will be removed in a future release. */
  toogle(param) {
    if (import.meta.env.DEV && !this._toogleWarned) {
      console.warn("[AppData] toogle() is deprecated; use toggle() instead.");
      this._toogleWarned = true;
    }
    return this.toggle(param);
  },

  /**
   * Verifica se um path existe no state (sem lançar erro).
   *
   * @param {string} param  Caminho dot-notation.
   * @returns {boolean}
   */
  exists(param) {
    const parts = param.split(".");
    const root = parts[0];
    if (root === "user_data") {
      const ud = useUserDataStore();
      if (parts.length === 1) return true;
      const path = parts.slice(1).join(".");
      return ud.getData(path) !== undefined;
    }
    return useAppStore().exists(param);
  },

  /**
   * Achata um objeto aninhado em notação de ponto.
   * Ex: `{ a: { b: 1 } }` → `{ "a.b": 1 }`.
   *
   * @param {Record<string, any>} data    Objeto a achatar.
   * @param {string}              parent  Prefixo acumulado (uso interno).
   * @param {Record<string, any>} result  Objeto de resultado (uso interno).
   * @returns {Record<string, any>}
   */
  flatten(data, parent = "", result = {}) {
    for (let key in data) {
      const prop = data[key];
      const newKey = parent ? `${parent}.${key}` : key;
      if (typeof prop === "object" && !Array.isArray(prop) && prop !== null) {
        this.flatten(prop, newKey, result);
      } else {
        result[newKey] = prop;
      }
    }
    return result;
  },
};
