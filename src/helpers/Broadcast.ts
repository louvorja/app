/** @category helper-puro — Wrapper de BroadcastChannel + bus local in-window.
 * Para Vue, prefira useBroadcastListener/useBroadcastSender.
 *
 * BroadcastChannel.postMessage() NÃO entrega à própria janela que postou.
 * Como ribbon e módulos rodam na mesma janela, mantemos um fan-out local
 * que entrega imediatamente para listeners registrados aqui.
 */
export { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import type { BroadcastMessage } from "@/helpers/BroadcastTypes";

const CHANNEL_NAME = "louvorja";

let channel: BroadcastChannel | null = null;
const _localListeners = new Set<(msg: BroadcastMessage) => void>();

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (e: MessageEvent<BroadcastMessage>) => {
      // Mensagens vindas de OUTRAS janelas chegam aqui — repassa pros listeners locais.
      for (const cb of _localListeners) {
        try {
          cb(e.data);
        } catch {
          /* noop */
        }
      }
    });
  }
  return channel;
}

export default {
  send(type: string, payload: unknown = {}): void {
    const msg: BroadcastMessage = { type, payload } as BroadcastMessage;
    try {
      getChannel().postMessage(msg);
    } catch {
      /* noop */
    }
    // Entrega local — outras janelas recebem via BroadcastChannel acima.
    for (const cb of _localListeners) {
      try {
        cb(msg);
      } catch {
        /* noop */
      }
    }
  },

  listen(callback: (msg: BroadcastMessage) => void): () => void {
    getChannel(); // garante a inscrição cross-window
    _localListeners.add(callback);
    return () => {
      _localListeners.delete(callback);
    };
  },
};
