/**
 * AppData.ts — Estado volátil de sessão do LouvorJA.
 *
 * Responsabilidade: camada de leitura/escrita sobre os stores Pinia usando
 * notação de ponto (dot-notation). Os dados vivem apenas na memória da
 * sessão atual — não persistem entre reloads.
 *
 * Stores usados:
 *   - appStore  — estado de app (flags, módulos, alert, popup, etc.)
 *   - userDataStore — preferências do usuário (tema, idioma, favoritos, etc.)
 *
 * Quem usa: helpers internos (UserData.ts, Alert.js, Popup.js, etc.) e
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

const _SCALAR_ACTIONS: Record<string, string> = {
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
  /** @internal usado apenas pela deprecação de toogle() */
  _toogleWarned: false,

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
   * @param param  Caminho dot-notation (ex: "user_data.theme", "loading").
   * @param value  Valor a armazenar.
   */
  set(param: string, value: unknown): void {
    const parts = param.split(".");
    const root = parts[0];

    if (root === "user_data") {
      const ud = useUserDataStore();
      if (parts.length === 1) {
        ud.$patch(value as Record<string, unknown>);
      } else {
        const path = parts.slice(1).join(".");
        ud.SET_PATH({ path, value });
      }
    } else if (_SCALAR_ACTIONS[root] && parts.length === 1) {
      (useAppStore() as unknown as Record<string, (v: unknown) => void>)[_SCALAR_ACTIONS[root]](value);
    } else if (root === "alert") {
      useAppStore().PATCH_ALERT({ key: parts[1], value });
    } else if (root === "modules" && parts.length >= 2) {
      const id = parts[1];
      const path = parts.slice(2).join(".");
      useAppStore().SET_MODULE_PATH({ id, path, value });
    } else {
      useAppStore().setData([...parts, value]);
    }

    const popup = this.get("popup");
    if (popup && param != "popup" && param != "is_popup" && param != "is_fullscreen") {
      if ((popup as Window).closed) {
        this.set("popup", null);
      } else {
        try {
          (popup as Window).postMessage({ param, value }, window.location.origin);
        } catch (e) {
          console.log(e);
        }
      }
    }
  },

  /**
   * Lê um valor do estado da sessão.
   *
   * @param param    Caminho dot-notation. Se omitido, retorna o state mesclado (app + user_data).
   * @param ifnull   Valor padrão quando o path não existe.
   */
  get<T = unknown>(param?: string, ifnull: T | null = null): T | null {
    if (!param) {
      const app = useAppStore();
      const ud = useUserDataStore();
      return { ...app.$state, user_data: ud.$state } as unknown as T;
    }

    const parts = param.split(".");
    const root = parts[0];

    if (root === "user_data") {
      const ud = useUserDataStore();
      if (parts.length === 1) return ud.$state as unknown as T;
      const path = parts.slice(1).join(".");
      const result = ud.getData(path);
      return result === undefined ? ifnull : (result as T);
    }

    const store = useAppStore();
    if (!store.exists(param)) return ifnull;
    return store.getData(param) as T;
  },

  /**
   * Retorna o state serializado e achatado em notação de ponto.
   * Remove `popup` e `is_popup` (não serializáveis via postMessage).
   */
  getFlatten(): Record<string, unknown> {
    const raw = Object.assign({}, this.get()) as Record<string, unknown>;
    delete raw["popup"];
    delete raw["is_popup"];
    const cleaned = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
    return this.flatten(cleaned);
  },

  /**
   * Adiciona um elemento a um array no estado.
   *
   * @param param  Caminho dot-notation para o array.
   * @param value  Elemento a adicionar.
   */
  addElement(param: string, value: unknown): void {
    useAppStore().addElementArray([param, value]);
  },

  /**
   * Remove um elemento de um array no estado (por igualdade de valor).
   *
   * @param param  Caminho dot-notation para o array.
   * @param value  Elemento a remover.
   */
  removeElement(param: string, value: unknown): void {
    useAppStore().removeElementArray([param, value]);
  },

  /**
   * Inverte o valor booleano de um campo.
   *
   * @param param  Caminho dot-notation.
   */
  toggle(param: string): void {
    this.set(param, !this.get(param));
  },

  /** @deprecated Use `toggle` (correct spelling). Will be removed in a future release. */
  toogle(param: string): void {
    if (import.meta.env.DEV && !this._toogleWarned) {
      console.warn("[AppData] toogle() is deprecated; use toggle() instead.");
      this._toogleWarned = true;
    }
    return this.toggle(param);
  },

  /**
   * Verifica se um path existe no state (sem lançar erro).
   *
   * @param param  Caminho dot-notation.
   */
  exists(param: string): boolean {
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
   * @param data    Objeto a achatar.
   * @param parent  Prefixo acumulado (uso interno).
   * @param result  Objeto de resultado (uso interno).
   */
  flatten(
    data: Record<string, unknown>,
    parent = "",
    result: Record<string, unknown> = {}
  ): Record<string, unknown> {
    for (const key in data) {
      const prop = data[key];
      const newKey = parent ? `${parent}.${key}` : key;
      if (typeof prop === "object" && !Array.isArray(prop) && prop !== null) {
        this.flatten(prop as Record<string, unknown>, newKey, result);
      } else {
        result[newKey] = prop;
      }
    }
    return result;
  },
};
