/**
 * Composable que conecta um módulo à view genérica `/projection/module`.
 *
 * Cada módulo:
 *   - chama emit({ text, reference, active }) sempre que seu valor visível muda
 *   - opcionalmente registra `onAction` para responder à ribbon contextual
 *
 * O composable cuida de:
 *   - escutar REQUEST_MODULE_STATE e reemitir o último valor
 *   - escutar MODULE_RIBBON_ACTION e despachar para o handler local
 *
 * Exemplo de uso (counter):
 *   const projection = useModuleProjection("counter", {
 *     onAction(action) {
 *       if (action === "increment") count.value++;
 *       if (action === "reset") count.value = 0;
 *     },
 *   });
 *   watch(count, (n) => projection.emit({ text: String(n), active: true }));
 */

import { ref } from "vue";
import Broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useBroadcastListener } from "@/composables/useBroadcastListener";

interface ProjectionPayload {
  text?: string;
  reference?: string;
  active?: boolean;
}

interface UseModuleProjectionOptions {
  /** Handler para BIBLE_RIBBON_ACTION/MODULE_RIBBON_ACTION quando o módulo está ativo. */
  onAction?: (action: string, payload?: unknown) => void;
  /** Returna true se o módulo está visível/ativo agora (controla quem responde). */
  isVisible?: () => boolean;
}

export function useModuleProjection(moduleId: string, opts: UseModuleProjectionOptions = {}) {
  const _last = ref<ProjectionPayload>({ text: "", reference: "", active: false });

  function emit(payload: ProjectionPayload) {
    _last.value = { ...payload };
    Broadcast.send(BROADCAST_TYPE.MODULE_PROJECTION_VALUE, {
      module: moduleId,
      ...payload,
    });
  }

  // Re-emite o último valor quando uma janela de projeção pede.
  useBroadcastListener(BROADCAST_TYPE.REQUEST_MODULE_STATE, (payload) => {
    if ((payload as { module?: string })?.module !== moduleId) return;
    Broadcast.send(BROADCAST_TYPE.MODULE_PROJECTION_VALUE, {
      module: moduleId,
      ..._last.value,
    });
  });

  // Recebe ações da ribbon contextual.
  useBroadcastListener(BROADCAST_TYPE.MODULE_RIBBON_ACTION, (payload) => {
    const data = payload as { module?: string; action?: string; payload?: unknown };
    if (data?.module !== moduleId) return;
    if (opts.isVisible && !opts.isVisible()) return;
    if (data.action && opts.onAction) opts.onAction(data.action, data.payload);
  });

  return { emit, _last };
}
