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
 * @category deve-virar-composable — Usa userDataStore (Pinia); requer renderer inicializado.
 */

import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";
import $broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import Platform from "@/helpers/Platform";
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
// Cleanup das subscrições da última chamada de initCrossWindow — usado para
// evitar acumular listeners em HMR (Vite recarrega o módulo, listeners
// antigos ficavam vivos e duplicavam apply() para o mesmo patch).
let _crossWindowCleanup: (() => void) | null = null;
// Token único por renderer — usado para ignorar broadcasts originados aqui
// mesmo (BroadcastChannel não entrega para a janela que postou, mas se um
// dia precisarmos de fan-out local para mesma chave isso evita loops).
const _SRC = `udata-${Math.random().toString(36).slice(2, 10)}`;
// Quando true, set() apenas escreve no store local SEM broadcastar nem
// persistir — usado pelo handler que recebe um patch remoto, evitando
// echo infinito entre janelas.
let _suppressBroadcast = false;

/**
 * Hidrata o Pinia store profundamente a partir de um snapshot — funciona
 * mesmo quando keys top-level (como `options`) estavam vazias no state
 * inicial. Antes usávamos `Object.assign(state, snapshot)` dentro de $patch,
 * mas em janelas auxiliares (Projeção) sub-objetos como `options.custom_background`
 * não estavam refletindo no getter `getData(...)`, mesmo com o $patch
 * resolvendo. Garantia agora: SET_PATH por leaf key, que é exatamente o
 * mesmo caminho usado em runtime (e, portanto, dispara reatividade
 * idêntica ao caso sincronizado via patch).
 */
function _hydrateStore(snapshot: Record<string, unknown>): void {
  const store = useUserDataStore();
  const visit = (prefix: string, value: unknown): void => {
    // Folhas: arrays, primitives e null vão direto via SET_PATH.
    // Objetos puros recursam para preservar deep merge — não sobrescreve
    // chaves não presentes em `snapshot`.
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      // Garante que o caminho é objeto antes de recursar (evita string + .)
      if (prefix && store.getData(prefix) === undefined) {
        store.SET_PATH({ path: prefix, value: {} });
      }
      for (const key of Object.keys(value as Record<string, unknown>)) {
        const sub = (value as Record<string, unknown>)[key];
        visit(prefix ? `${prefix}.${key}` : key, sub);
      }
      return;
    }
    if (prefix) store.SET_PATH({ path: prefix, value });
  };
  visit("", snapshot);
}

export default {
  /**
   * Persiste o estado completo de `user_data` no Storage.
   *
   * Usa debounce de 300ms para agrupar múltiplas escritas consecutivas
   * numa única operação de I/O — importante em interações de drag-and-drop
   * e sliders que disparam dezenas de eventos por segundo.
   */
  save(): void {
    // Em desktop (Electron) o main process é a fonte da verdade — toda
    // chamada `userdata:patch` IPC já atualiza `_userDataMain` e persiste
    // sincronamente no disco via userStore.write. Se o renderer também
    // chamasse Storage.set("user_data", $state) com debounce, teríamos
    // duas escritas concorrentes no mesmo arquivo, com risco do snapshot
    // velho do renderer (300ms atrás) sobrescrever o que o main acabou
    // de gravar. No desktop apenas atualizamos o cache local em memória
    // (sincronia visual com a UI atual) e deixamos o main persistir.
    if (Platform.isDesktop) {
      // Atualiza só o _desktopCache — mantém leituras síncronas
      // consistentes durante a sessão sem persistir no disco a partir
      // daqui (main já cuida da persistência via userdata:patch).
      try {
        $storage.setLocalCache("user_data", useUserDataStore().$state);
      } catch (_) { /* ignore — método pode não existir em web */ }
      return;
    }
    if (_saveTimer !== null) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      $dev.write("salvando dados");
      $storage.set("user_data", useUserDataStore().$state);
    }, 300);
  },

  /**
   * Carrega as preferências salvas do Storage para o store.
   * Chamado uma vez no boot, antes de montar o app.
   *
   * Em desktop (Electron), além do disco, busca o snapshot vivo no main
   * process via IPC `userdata:fetch`. Isso garante que janelas auxiliares
   * abertas logo após uma mudança recebam o estado mais recente, mesmo se
   * o save debounceado ainda não tiver chegado ao disco.
   */
  load(): void {
    $dev.write("carregando dados");
    const saved = $storage.get("user_data");
    if (saved && typeof saved === "object") {
      _hydrateStore(saved as Record<string, unknown>);
    }
    // Em desktop, sobrescreve com o snapshot do main (fonte da verdade).
    // Async — não bloqueia o boot. Quando responder, atualiza o store.
    if (Platform.isDesktop) {
      try {
        const api = Platform.api as
          | { invoke?: (channel: string, ...args: unknown[]) => Promise<unknown> }
          | null;
        if (api && typeof api.invoke === "function") {
          api.invoke("userdata:fetch")
            .then((fresh: unknown) => {
              if (fresh && typeof fresh === "object") {
                _suppressBroadcast = true;
                try {
                  _hydrateStore(fresh as Record<string, unknown>);
                } finally {
                  _suppressBroadcast = false;
                }
              }
            })
            .catch(() => { /* main pode estar inicializando — disco já cobriu */ });
        }
      } catch { /* ignore */ }
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
    if (_suppressBroadcast) {
      // Patch chegou de outra janela — só atualiza o store local, sem
      // re-broadcastar nem persistir (a janela origem já persistiu).
      return;
    }
    this.save();
    // Fan-out para outras janelas. Mandamos pelos DOIS canais:
    //
    //   1. BroadcastChannel — funciona cross-tab (web/PWA) e idealmente
    //      cross-window no Electron 41+ (sandbox: false + mesma origem).
    //   2. IPC main process — fallback determinístico para o desktop, já que
    //      o cross-process do BroadcastChannel é flaky em alguns drivers.
    //
    // Listeners deduplicam pelo `_src`, então não há risco de aplicar o
    // mesmo patch duas vezes na janela destino.
    const payload = { path: param, value, _src: _SRC };
    try {
      $broadcast.send(BROADCAST_TYPE.USERDATA_PATCH, payload);
    } catch {
      /* canal pode não existir em testes node-only */
    }
    if (Platform.isDesktop) {
      try {
        const api = Platform.api as
          | { invoke?: (channel: string, ...args: unknown[]) => unknown }
          | null;
        if (api && typeof api.invoke === "function") {
          api.invoke("userdata:patch", payload);
        } else if (Platform.userdata?.patch) {
          Platform.userdata.patch(payload);
        }
      } catch {
        /* IPC offline durante boot inicial — broadcast já cobriu */
      }
    }
  },

  /**
   * Inicializa o listener cross-window de mudanças de UserData.
   *
   * Idempotente — chame uma vez por renderer (em main.js). Cada janela
   * Vue recebe os patches das outras e atualiza seu Pinia store local
   * sem re-broadcastar nem persistir, garantindo que opções definidas
   * na janela principal apareçam imediatamente na projeção.
   */
  initCrossWindow(): void {
    // Em HMR (Vite) o módulo recarrega e initCrossWindow é chamado de novo.
    // Sem desfazer subscrições anteriores, listeners ficavam acumulando e
    // o mesmo patch era aplicado N vezes a cada hot reload.
    if (_crossWindowCleanup) {
      try { _crossWindowCleanup(); } catch (_) { /* ignore */ }
      _crossWindowCleanup = null;
    }
    const apply = (payload: { path?: string; value?: unknown; _src?: string } | null): void => {
      if (!payload || typeof payload.path !== "string") return;
      if (payload._src === _SRC) return; // veio daqui — ignora
      _suppressBroadcast = true;
      try {
        this.set(payload.path, payload.value);
      } finally {
        _suppressBroadcast = false;
      }
    };
    // Canal 1 — BroadcastChannel (web/PWA + Electron quando funciona)
    const offBroadcast = $broadcast.listen((msg) => {
      if (!msg || msg.type !== BROADCAST_TYPE.USERDATA_PATCH) return;
      apply(msg.payload as { path?: string; value?: unknown; _src?: string } | null);
    });
    // Canal 2 — IPC do Electron (fallback determinístico).
    // louvorjaApi.on é genérico e existe no preload desde D0 — sync funciona
    // mesmo em janelas com preload antigo, contanto que o main.cjs novo esteja
    // ativo (que registra o webContents.send("userdata:patch", ...)).
    let offIpc: (() => void) | null = null;
    if (Platform.isDesktop) {
      try {
        const api = Platform.api as
          | { on?: (channel: string, h: (data: unknown) => void) => () => void }
          | null;
        if (api && typeof api.on === "function") {
          offIpc = api.on("userdata:patch", (data: unknown) =>
            apply(data as { path?: string; value?: unknown; _src?: string } | null)
          ) || null;
        } else if (Platform.userdata?.onPatch) {
          const off = Platform.userdata.onPatch((data: unknown) =>
            apply(data as { path?: string; value?: unknown; _src?: string } | null)
          );
          if (typeof off === "function") offIpc = off;
        }
      } catch (e) {
        console.warn("[UserData] IPC onPatch falhou:", e);
      }
    }
    _crossWindowCleanup = () => {
      try { offBroadcast(); } catch (_) { /* ignore */ }
      try { offIpc?.(); } catch (_) { /* ignore */ }
    };
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
