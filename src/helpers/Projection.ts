/**
 * @category helper-puro — Camada única para abrir telas em monitores específicos.
 *
 * Web/PWA: usa window.open + BroadcastChannel.
 * Desktop (Electron): usa Platform.windows.open + Platform.displays para
 * posicionar a janela no monitor escolhido (D4).
 *
 * Cada chamada precisa de um `feature` (string única que identifica a projeção
 * — ex: "bible", "music", "obs-bible"). A preferência de monitor é persistida
 * por feature via Platform.displays.setPreferred() no desktop e via UserData
 * em fallback web.
 */

import Platform from "@/helpers/Platform";
import $userdata from "@/helpers/UserData";

export interface DisplayInfo {
  id: number | null;
  label: string;
  primary: boolean;
  bounds: { x: number; y: number; width: number; height: number };
}

interface NativeDisplay {
  id: number;
  label?: string;
  primary?: boolean;
  bounds: { x: number; y: number; width: number; height: number };
}

interface OpenOptions {
  route: string;
  feature: string;
  monitorId?: number | null;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  frame?: boolean;
}

const _webWindows: Record<string, Window | null> = {};
const _PREFS_KEY = "displays.preferred";

/**
 * Fallback hierárquico — quando uma feature não tem monitor explicitamente
 * escolhido, herda do grupo default:
 *
 *   "presentation" → mesma tela usada para projetar slides de música
 *   "return"       → mesma tela do stage display (retorno)
 *
 * Assim, configurar "Monitor 2" para projeção uma vez já leva a Bíblia,
 * sorteios, cronômetro etc. para lá. O Relógio cai no monitor de retorno.
 */
const FEATURE_GROUP: Record<string, "presentation" | "return"> = {
  // Apresentação principal — segue "musicas" (projection)
  bible: "presentation",
  counter: "presentation",
  draw: "presentation",
  name_draw: "presentation",
  message_board: "presentation",
  stopwatch: "presentation",
  // Stage display / monitor de retorno (visível ao músico/operador)
  clock: "return",
};

const GROUP_TO_FEATURE = {
  presentation: "musicas", // alinhado com ProjectionWindows.ts FEATURE_PROJECTION
  return: "retorno",        // FEATURE_RETURN
} as const;

function _featureKey(feature: string): string {
  // Mantém compat com features já usadas em ProjectionWindows.ts
  // ("musicas", "operador", "retorno") — passa direto.
  return feature;
}

/** Retorna a feature de fallback para um módulo, ou null se não houver. */
function _fallbackFeature(feature: string): string | null {
  const group = FEATURE_GROUP[feature];
  return group ? GROUP_TO_FEATURE[group] : null;
}

async function _getDisplaysApi() {
  return Platform.isDesktop ? Platform.displays : null;
}

async function _getWindowsApi() {
  return Platform.isDesktop ? Platform.windows : null;
}

/** Lista os monitores disponíveis. Web/PWA retorna um único "monitor" lógico. */
export async function listDisplays(): Promise<DisplayInfo[]> {
  const api = await _getDisplaysApi();
  if (api?.list) {
    try {
      const list = (await api.list()) as NativeDisplay[];
      return list.map((d, i) => ({
        id: d.id,
        label: d.label || `Monitor ${i + 1}`,
        primary: !!d.primary,
        bounds: d.bounds,
      }));
    } catch (e) {
      console.warn("[Projection] displays.list falhou:", e);
    }
  }
  // Web fallback: um monitor lógico (a tela do navegador).
  if (typeof window !== "undefined" && window.screen) {
    return [
      {
        id: null,
        label: "Tela atual",
        primary: true,
        bounds: { x: 0, y: 0, width: window.screen.width, height: window.screen.height },
      },
    ];
  }
  return [];
}

async function _getRawPreferred(feature: string): Promise<number | null> {
  const api = await _getDisplaysApi();
  if (api?.getPreferred) {
    try {
      const pref = (await api.getPreferred(_featureKey(feature))) as
        | { id?: number | null }
        | number
        | null;
      if (pref && typeof pref === "object") return pref.id ?? null;
      if (typeof pref === "number") return pref;
      return null;
    } catch {
      /* falha silenciosa — usa fallback */
    }
  }
  const prefs = ($userdata.get(_PREFS_KEY, {}) as Record<string, number | null>) ?? {};
  return prefs[feature] ?? null;
}

/**
 * Retorna o monitorId preferido da feature, ou null se "mesma janela".
 *
 * Aplica fallback hierárquico:
 *   1. Tenta a preferência explícita da feature (ex: "clock")
 *   2. Se nada, herda do grupo (ex: clock -> "retorno", bible -> "musicas")
 *   3. Se ainda nada, retorna null (mesma janela)
 *
 * Use { explicit: true } para pegar SOMENTE a preferência explícita
 * (sem aplicar fallback) — útil para mostrar "Padrão" no botão.
 */
export async function getPreferredMonitor(
  feature: string,
  opts: { explicit?: boolean } = {}
): Promise<number | null> {
  const own = await _getRawPreferred(feature);
  if (own != null || opts.explicit) return own;

  const fallback = _fallbackFeature(feature);
  if (fallback) return await _getRawPreferred(fallback);

  return null;
}

/** Retorna a feature usada como fallback (ex: "musicas" para bible). */
export function getFallbackFeature(feature: string): string | null {
  return _fallbackFeature(feature);
}

/** True se a feature está usando a preferência herdada (sem escolha explícita). */
export async function isUsingFallback(feature: string): Promise<boolean> {
  const own = await _getRawPreferred(feature);
  return own == null && _fallbackFeature(feature) != null;
}

/** Salva o monitorId preferido para a feature. Use null para "mesma janela". */
export async function setPreferredMonitor(
  feature: string,
  monitorId: number | null
): Promise<void> {
  const api = await _getDisplaysApi();
  if (api?.setPreferred) {
    try {
      await api.setPreferred(_featureKey(feature), monitorId);
      return;
    } catch {
      /* falha silenciosa — usa fallback */
    }
  }
  const prefs = { ...(($userdata.get(_PREFS_KEY, {}) as Record<string, number | null>) ?? {}) };
  if (monitorId == null) delete prefs[feature];
  else prefs[feature] = monitorId;
  $userdata.set(_PREFS_KEY, prefs);
}

/** Mostra overlay "Monitor N" em todos os displays por durationMs (default 5000). */
export async function identifyDisplays(durationMs = 5000): Promise<void> {
  const api = await _getDisplaysApi();
  if (api?.identify) {
    try {
      await api.identify(durationMs);
    } catch (e) {
      console.warn("[Projection] displays.identify falhou:", e);
    }
  }
}

/** Verifica se a feature já está com janela aberta. */
export async function isOpen(feature: string): Promise<boolean> {
  const api = await _getWindowsApi();
  if (api?.listOpen) {
    try {
      const open = (await api.listOpen()) as string[];
      return open.includes(feature);
    } catch {
      /* fallback */
    }
  }
  const w = _webWindows[feature];
  return !!w && !w.closed;
}

/** Abre a janela de projeção no monitor escolhido (ou no preferido). */
export async function open(opts: OpenOptions): Promise<void> {
  const monitorId = opts.monitorId ?? (await getPreferredMonitor(opts.feature));
  const fullscreen = opts.fullscreen ?? true;
  const alwaysOnTop = opts.alwaysOnTop ?? false;
  const frame = opts.frame ?? !fullscreen;

  const api = await _getWindowsApi();
  if (api?.open) {
    try {
      await api.open({
        route: opts.route,
        feature: opts.feature,
        monitorId: monitorId ?? null,
        fullscreen,
        frame,
        alwaysOnTop,
      });
      return;
    } catch (e) {
      console.warn("[Projection] windows.open falhou, fallback web:", e);
    }
  }

  // Fallback web/PWA
  const existing = _webWindows[opts.feature];
  if (existing && !existing.closed) {
    existing.focus();
    return;
  }
  const features = fullscreen
    ? "noopener,noreferrer,fullscreen=yes"
    : "noopener,noreferrer,width=1280,height=720";
  _webWindows[opts.feature] = window.open(opts.route, `louvorja_${opts.feature}`, features);
}

/** Fecha a janela da feature, se estiver aberta. */
export async function close(feature: string): Promise<void> {
  const api = await _getWindowsApi();
  if (api?.close) {
    try {
      await api.close(feature);
    } catch {
      /* noop */
    }
  }
  const w = _webWindows[feature];
  if (w && !w.closed) w.close();
  _webWindows[feature] = null;
}

/** Toggle aberto/fechado, com monitor opcional. Útil para botão de projeção. */
export async function toggle(opts: OpenOptions): Promise<boolean> {
  if (await isOpen(opts.feature)) {
    await close(opts.feature);
    return false;
  }
  await open(opts);
  return true;
}

export default {
  listDisplays,
  getPreferredMonitor,
  setPreferredMonitor,
  identifyDisplays,
  isOpen,
  open,
  close,
  toggle,
  getFallbackFeature,
  isUsingFallback,
};
