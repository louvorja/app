import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";
import Platform from "@/helpers/Platform";

export interface ElectronDisplay {
  id: number | string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  primary: boolean;
  isInternal?: boolean;
}

type DisplayPrefs = Record<string, number | string>;

/**
 * useDisplays — composable que mantém lista reativa de monitores disponíveis.
 *
 * Disponível apenas no Electron (Platform.displays). No web/PWA retorna lista vazia.
 *
 * Features comuns para preferred:
 *   - "musicas"  : monitor da projeção principal
 *   - "operador" : monitor da grade de slides
 *   - "retorno"  : monitor do stage display
 *   - "videos"   : monitor de vídeos on-line
 *   - "biblia"   : monitor da bíblia
 */
export function useDisplays(): {
  displays: Ref<ElectronDisplay[]>;
  prefs: Ref<DisplayPrefs>;
  refresh: () => Promise<void>;
  setPreferred: (feature: string, displayId: number | string) => Promise<void>;
  getPreferred: (feature: string) => number | string | null;
  identify: (durationMs?: number) => Promise<void>;
} {
  const displays = ref<ElectronDisplay[]>([]);
  const prefs    = ref<DisplayPrefs>({});

  async function refresh(): Promise<void> {
    if (!Platform.displays) {
      displays.value = [];
      prefs.value    = {};
      return;
    }
    try {
      const list = await Platform.displays.list();
      displays.value = Array.isArray(list) ? list : [];
      const p = await Platform.displays.getPrefs();
      prefs.value = p || {};
    } catch (err) {
      console.error("[useDisplays] refresh falhou:", err);
      displays.value = [];
      prefs.value    = {};
    }
  }

  async function setPreferred(feature: string, displayId: number | string): Promise<void> {
    if (!Platform.displays) return;
    try {
      await Platform.displays.setPreferred(feature, displayId);
      prefs.value = { ...prefs.value, [feature]: displayId };
    } catch (err) {
      console.error("[useDisplays] setPreferred falhou:", err);
    }
  }

  function getPreferred(feature: string): number | string | null {
    return prefs.value?.[feature] ?? null;
  }

  async function identify(durationMs = 5000): Promise<void> {
    if (!Platform.displays) return;
    try {
      await Platform.displays.identify(durationMs);
    } catch (err) {
      console.error("[useDisplays] identify falhou:", err);
    }
  }

  let removeListener: (() => void) | null = null;

  onMounted(() => {
    refresh();
    // No Electron, escuta mudanças via window resize ou hot reattach
    if (typeof window !== "undefined") {
      const handler = () => refresh();
      window.addEventListener("focus", handler);
      removeListener = () => window.removeEventListener("focus", handler);
    }
  });

  onBeforeUnmount(() => {
    if (removeListener) removeListener();
  });

  return {
    displays,
    prefs,
    refresh,
    setPreferred,
    getPreferred,
    identify,
  };
}
