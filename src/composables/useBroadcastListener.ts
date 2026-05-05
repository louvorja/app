import { onUnmounted } from "vue";
import $broadcast from "@/helpers/Broadcast";
import type { BroadcastMessage } from "@/helpers/BroadcastTypes";

/**
 * Registra um listener do BroadcastChannel("louvorja") e remove automaticamente
 * no `onUnmounted` do componente — elimina memory leaks e side-effects fantasma.
 *
 * Pode ser chamado múltiplas vezes no mesmo `setup()` para tipos diferentes.
 *
 * @param type  Tipo(s) a ouvir, ou "*" para todos.
 * @param handler  Callback chamado com (payload, msg).
 */
export function useBroadcastListener(
  type: string | string[],
  handler: (payload: unknown, msg: BroadcastMessage) => void
): void {
  const unlisten = $broadcast.listen((msg) => {
    if (
      type === "*" ||
      msg.type === type ||
      (Array.isArray(type) && type.includes(msg.type))
    ) {
      handler(msg.payload, msg);
    }
  });

  onUnmounted(() => unlisten());
}
