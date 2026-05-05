import $broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";

interface BroadcastSender {
  send: (type: string, payload?: unknown) => void;
  BROADCAST_TYPE: typeof BROADCAST_TYPE;
}

/**
 * Retorna um helper de envio tipado para o BroadcastChannel("louvorja").
 *
 * @example
 * const { send, BROADCAST_TYPE } = useBroadcastSender();
 * send(BROADCAST_TYPE.GO_TO_SLIDE, { index: 2 });
 */
export function useBroadcastSender(): BroadcastSender {
  return {
    send: (type: string, payload: unknown = {}) => $broadcast.send(type, payload),
    BROADCAST_TYPE,
  };
}
