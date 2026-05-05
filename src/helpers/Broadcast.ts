export { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import type { BroadcastMessage } from "@/helpers/BroadcastTypes";

const CHANNEL_NAME = "louvorja";

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export default {
  send(type: string, payload: unknown = {}): void {
    try {
      getChannel().postMessage({ type, payload });
    } catch {
      /* noop */
    }
  },

  listen(callback: (msg: BroadcastMessage) => void): () => void {
    const ch = getChannel();
    const handler = (e: MessageEvent<BroadcastMessage>) => callback(e.data);
    ch.addEventListener("message", handler);
    return () => ch.removeEventListener("message", handler);
  },
};
