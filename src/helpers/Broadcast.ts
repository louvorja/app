/** @category helper-puro — Wrapper de BroadcastChannel + bus local in-window.
 * Para Vue, prefira useBroadcastListener/useBroadcastSender.
 *
 * Por que mantemos um fan-out local:
 *   `BroadcastChannel.postMessage()` NÃO entrega à própria janela. Como o
 *   ribbon e os módulos rodam na mesma janela do emissor, o fan-out local
 *   garante que listeners aqui vejam imediatamente o que acabou de ser
 *   despachado.
 *
 * Bridge para clients HTTP remotos (servidor embarcado em `/events`):
 *   - Em janelas Electron com `Platform.transmission` disponível, todo
 *     `send()` cujo tipo está em `STATEFUL_TYPES` é encaminhado ao main
 *     process via IPC. O main filtra para só aceitar da janela principal e
 *     redistribui via SSE.
 *   - No cliente HTTP remoto, o script injetado em `spa.js` recebe os
 *     eventos via `EventSource` e os enfileira em `window.__ljSseBuffer`
 *     (porque o bundle Vue ainda pode não ter terminado de carregar).
 *     Quando este módulo é importado, drena o buffer; daí em diante,
 *     entregamos via `CustomEvent("louvorja-sse")`.
 *
 * Cache de estado:
 *   Para os mesmos tipos relayáveis (estado de slide, versículo, módulo),
 *   guardamos o último payload recebido. Quando um listener registra via
 *   `listen()`, fazemos replay imediato. Sem isso, abrir `/musica?retorno`
 *   com música já tocando deixaria a tela em branco até a próxima troca
 *   de slide.
 */
export { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import type { BroadcastMessage } from "@/helpers/BroadcastTypes";
import Platform from "@/helpers/Platform";

const CHANNEL_NAME = "louvorja";

/**
 * Tipos que representam ESTADO contínuo (replay no listener registrar e
 * encaminhamento via SSE). Eventos transitórios in-app (hotkeys, ribbon
 * actions, command palette, requests) ficam fora.
 */
const STATEFUL_TYPES = new Set<string>([
  "slide_change",
  "slides_data",
  "media_close",
  "bible_verse",
  "bible_format_changed",
  "module_projection_value",
  "module_format_changed",
  "message_board",
]);

let channel: BroadcastChannel | null = null;
const _localListeners = new Set<(msg: BroadcastMessage) => void>();
const _lastByType = new Map<string, BroadcastMessage>();

function _deliverLocal(msg: BroadcastMessage): void {
  if (msg && typeof msg.type === "string") {
    // `media_close` invalida o estado de slide acumulado — listeners que
    // registrarem depois (ex: OBS recarregado em outra máquina) não devem
    // receber replay da música anterior. O evento em si é transitório.
    if (msg.type === "media_close") {
      _lastByType.delete("slide_change");
      _lastByType.delete("slides_data");
    } else if (STATEFUL_TYPES.has(msg.type)) {
      _lastByType.set(msg.type, msg);
    }
  }
  for (const cb of _localListeners) {
    try { cb(msg); } catch { /* noop */ }
  }
}

// Inicialização eager (top-level) — precisa rodar ANTES do primeiro
// `listen()`/`send()` para que mensagens entregues pelo bridge SSE durante
// o boot não sejam perdidas. Idempotente: módulos importados duas vezes
// não duplicam listeners.
function _initOnce(): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__ljBroadcastInit) return;
  w.__ljBroadcastInit = true;

  // Listener para mensagens SSE encaminhadas pelo bridge — estabelecido
  // antes de qualquer `dispatch`, não tem race.
  window.addEventListener("louvorja-sse", (e: Event) => {
    const detail = (e as CustomEvent).detail as BroadcastMessage | undefined;
    if (detail && typeof detail.type === "string") _deliverLocal(detail);
  });

  // Drena o buffer acumulado pelo bridge antes do bundle Vue carregar.
  // A partir daqui, o bridge passa a entregar via CustomEvent direto.
  const buf = (w.__ljSseBuffer as BroadcastMessage[] | undefined) || [];
  for (const msg of buf) _deliverLocal(msg);
  w.__ljSseBuffer = [];
  w.__ljSseDrained = true;
}

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (e: MessageEvent<BroadcastMessage>) => {
      // Mensagens vindas de OUTRAS janelas chegam aqui — repassa pros listeners locais.
      _deliverLocal(e.data);
    });
  }
  return channel;
}

_initOnce();

export default {
  send(type: string, payload: unknown = {}): void {
    const msg: BroadcastMessage = { type, payload } as BroadcastMessage;
    try {
      getChannel().postMessage(msg);
    } catch {
      /* noop */
    }
    // Entrega local — outras janelas Electron recebem via BroadcastChannel acima.
    _deliverLocal(msg);

    // Encaminhamento para clients SSE remotos. O main process filtra para
    // só aceitar da janela principal — nas janelas auxiliares isso vira
    // no-op silencioso e nada é duplicado.
    if (STATEFUL_TYPES.has(type)) {
      const t = Platform.transmission;
      if (t && typeof t.broadcast === "function") {
        try { t.broadcast(msg); } catch { /* noop */ }
      }
    }
  },

  listen(callback: (msg: BroadcastMessage) => void): () => void {
    getChannel(); // garante a inscrição cross-window
    _localListeners.add(callback);

    // Replay do último estado conhecido — listeners que registram depois
    // do boot (ex: Obs.vue montado num browser que abriu com música já
    // tocando) precisam ver o estado atual sem esperar a próxima emissão.
    for (const msg of _lastByType.values()) {
      try { callback(msg); } catch { /* noop */ }
    }

    return () => {
      _localListeners.delete(callback);
    };
  },
};
