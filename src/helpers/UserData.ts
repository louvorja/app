/**
 * UserData.ts — Preferências do usuário com persistência automática.
 *
 * Responsabilidade: wrapper sobre userDataStore (Pinia) para o namespace
 * `user_data`. Toda escrita agenda um save com debounce de 300ms para não
 * sobrecarregar o Storage durante interações rápidas (ex: drag-and-drop,
 * sliders que disparam dezenas de eventos por segundo).
 *
 * Quem usa: componentes e módulos que precisam ler ou salvar preferências
 * do usuário (tema, idioma, favoritos, configurações de módulo, etc.).
 *
 * Fluxo completo de uma escrita:
 *   UserData.set("theme", "dark")
 *     → userDataStore.SET_PATH({ path: "theme", value: "dark" })
 *       → state.theme = "dark"
 *     → UserData.save() [debounce 300ms]
 *       → Storage.set("user_data", { theme: "dark", ... })
 */

import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";
import { useUserDataStore } from "@/stores/userDataStore";

export interface RemoteConfig {
  is_connected: boolean;
  url: string;
  token: string;
}

export interface UserDataState {
  theme: string;
  language: "pt" | "es";
  layout: "apps" | "ribbon";
  remote: RemoteConfig;
  favorites: string[];
  history: string[];
  modules: Record<string, unknown>;
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null;

export default {
  /**
   * Persiste o estado completo de `user_data` no Storage.
   *
   * Usa debounce de 300ms para agrupar múltiplas escritas consecutivas
   * numa única operação de I/O — importante em interações de drag-and-drop
   * e sliders que disparam dezenas de eventos por segundo.
   */
  save(): void {
    if (_saveTimer !== null) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      $dev.write("salvando dados");
      $storage.set("user_data", useUserDataStore().$state);
    }, 300);
  },

  /**
   * Carrega as preferências salvas do Storage para o store.
   * Chamado uma vez no boot, antes de montar o app.
   */
  load(): void {
    $dev.write("carregando dados");
    const saved = $storage.get("user_data");
    if (saved) {
      useUserDataStore().$patch((state) => {
        Object.assign(state, saved);
      });
    }
  },

  /**
   * Escreve uma preferência do usuário e agenda persistência.
   *
   * @param param  Campo dentro de `user_data` (ex: "theme", "modules.media.fade_audio").
   * @param value  Valor a armazenar.
   */
  set(param: string, value: unknown): void {
    $dev.write("set userdata", { param, value });
    useUserDataStore().SET_PATH({ path: param, value });
    this.save();
  },

  /**
   * Escreve uma preferência apenas se ela ainda não foi definida (null ou undefined).
   * Útil para inicializar valores padrão sem sobrescrever configurações existentes.
   *
   * Nota: não dispara save — use `set()` quando precisar persistir.
   *
   * @param param  Campo dentro de `user_data`.
   * @param value  Valor padrão.
   */
  setIfNull(param: string, value: unknown): void {
    $dev.write("setIfNull userdata", { param, value });
    const current = useUserDataStore().getData(param);
    if (current === null || current === undefined) {
      useUserDataStore().SET_PATH({ path: param, value });
    }
  },

  /**
   * Lê uma preferência do usuário.
   *
   * @param param   Campo dentro de `user_data`. Se omitido, retorna o objeto inteiro.
   * @param ifnull  Valor padrão quando o campo não existe.
   */
  get<T = unknown>(param?: string, ifnull: T | null = null): T | null {
    const ud = useUserDataStore();
    if (!param) return ud.$state as unknown as T;
    const result = ud.getData(param);
    return result === undefined ? ifnull : (result as T);
  },
};
