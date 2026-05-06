/**
 * Composable de formatação de módulo — fornece um proxy reativo (`fmt`)
 * que lê/escreve em UserData e dispara um broadcast `MODULE_FORMAT_CHANGED`
 * para que janelas de projeção atualizem ao vivo.
 *
 * Uso:
 *   const { fmt, restoreFormat, customization } = useModuleFormat(moduleId, manifest);
 *
 *   <input v-model="fmt.font_color" type="color" />
 *
 * Cada módulo declara os campos no `manifest.customization` — não há
 * necessidade de duplicar nada.
 */

import { reactive, computed, ref } from "vue";
import UserData from "@/helpers/UserData";
import Broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";

interface CustomizationField {
  type: string;
  label?: string;
  default?: unknown;
  options?: string[];
}

interface ModuleManifest {
  id: string;
  customization?: Record<string, CustomizationField>;
}

export function useModuleFormat(moduleId: string, manifest: ModuleManifest) {
  const customization = computed(() => manifest.customization || {});

  const fmt = new Proxy({} as Record<string, unknown>, {
    get(_, key) {
      return UserData.get(`modules.${moduleId}.${String(key)}`, null);
    },
    set(_, key, value) {
      UserData.set(`modules.${moduleId}.${String(key)}`, value);
      Broadcast.send(BROADCAST_TYPE.MODULE_FORMAT_CHANGED, {
        module: moduleId,
        key: String(key),
        value,
      });
      return true;
    },
  });

  function restoreFormat() {
    const fields = manifest.customization || {};
    for (const [key, def] of Object.entries(fields)) {
      UserData.set(`modules.${moduleId}.${key}`, def?.default ?? null);
    }
    Broadcast.send(BROADCAST_TYPE.MODULE_FORMAT_CHANGED, {
      module: moduleId,
      key: "*",
      value: null,
    });
  }

  // Reactive view — força recálculo quando o broadcast chega de fora
  // (ex: outra janela alterou via projection).
  const reactiveView = reactive({} as Record<string, unknown>);

  // Toggle do painel "Formatar" (persistido em UserData).
  const show_format = computed({
    get: () => !!UserData.get(`modules.${moduleId}.show_format`, false),
    set: (v) => UserData.set(`modules.${moduleId}.show_format`, !!v),
  });

  return { fmt, restoreFormat, customization, reactiveView, show_format };
}

const FONT_OPTIONS = [
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Georgia, serif",
  "Times New Roman, serif",
  "Courier New, monospace",
];

export const FORMAT_FONT_OPTIONS = FONT_OPTIONS;
