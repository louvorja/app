/**
 * BroadcastTypes — contratos do canal BroadcastChannel("louvorja").
 *
 * Usar BROADCAST_TYPE.* em vez de strings literais em emissores e receptores.
 *
 * Categorias:
 *   - Cross-window: funcionam entre janelas/abas do mesmo origen (PWA/web).
 *     No Electron, BroadcastChannel não cruza processos — ver issue #116.
 *   - In-app: emitidos por hotkeys/HTTP e consumidos na mesma janela.
 *   - Planejado: definido mas ainda não emitido; reservado para uso futuro.
 * @category helper-puro — Só tipos e constantes; sem APIs Vue.
 */

export const BROADCAST_TYPE = Object.freeze({
  // ─── Cross-window ────────────────────────────────────────────────────────

  /** Estado atual do slide em reprodução. Emitido por Media.js, SlideEditor.
   *  Recebido por: Projection, ProjectionReturn, Obs, Operator. */
  SLIDE_CHANGE: "slide_change",

  /** Carga inicial de slides ao abrir uma música. Emitido por Media.js.
   *  Recebido por: Operator. */
  SLIDES_DATA: "slides_data",

  /** Solicitação de navegação para um slide específico. Emitido por Operator.
   *  Recebido por: Media.js (listener via getElement). */
  GO_TO_SLIDE: "go_to_slide",

  /** Versículo bíblico selecionado. Emitido por bible/Index.vue.
   *  Recebido por: ObsBible. */
  BIBLE_VERSE: "bible_verse",

  /** Texto do painel de recados. Emitido por message_board/Index.vue.
   *  Recebido por: (recepção futura). */
  MESSAGE_BOARD: "message_board",

  /** [planejado] Notificação de fechamento da mídia. Emit: Media.close().
   *  Recebido por: Projection, Obs. (ainda não emitido — ver Media.js). */
  MEDIA_CLOSE: "media_close",

  // ─── In-app (hotkeys / HTTP events → módulos) ────────────────────────────

  /** Número sorteado via HTTP externo. Recebido por: módulo draw. */
  DRAWING_NUMBER: "drawing_number",

  /** Nome sorteado via HTTP externo. Recebido por: módulo name_draw. */
  DRAWING_NAME: "drawing_name",

  /** Solicita recarga de dados do módulo ativo. Emitido por F5/F9 e Ctrl+Shift+F2. */
  MODULE_REFRESH: "module:refresh",

  /** Solicita foco no campo de busca do módulo ativo. Emitido por Ctrl+F. */
  MODULE_FOCUS_SEARCH: "module:focus_search",

  /** Solicita música anterior no álbum/liturgia. Emitido por Ctrl+←. */
  MEDIA_PREV_MUSIC: "media:prev_music",

  /** Solicita próxima música no álbum/liturgia. Emitido por Ctrl+→. */
  MEDIA_NEXT_MUSIC: "media:next_music",

  /** Abre diálogo de novo item na liturgia. Emitido por Ctrl+N. */
  LITURGY_NEW_ITEM: "liturgy:new_item",

  /** Abre diálogo de nova anotação na liturgia. Emitido por Ctrl+Shift+N. */
  LITURGY_NEW_ANNOTATION: "liturgy:new_annotation",
} as const);

export type BroadcastTypeValue = (typeof BROADCAST_TYPE)[keyof typeof BROADCAST_TYPE];

// ─── Interfaces de payload ──────────────────────────────────────────────────

export interface SlideChangePayload {
  slide_index: number;
  slide: Record<string, unknown> | null;
  next_slide: Record<string, unknown> | null;
  title?: string;
  progress: number;
  total_slides: number;
}

export interface SlidesDataPayload {
  slides: Record<string, unknown>[];
  title: string;
  slide_index: number;
}

export interface GoToSlidePayload {
  index: number;
}

export interface BibleVersePayload {
  text: string;
  reference: string;
  active: boolean;
}

export interface MessageBoardPayload {
  text: string;
  active: boolean;
}

export interface DrawingNumberPayload {
  number: number;
}

export interface DrawingNamePayload {
  name: string;
}

export interface ModuleRefreshPayload {
  clearCache?: boolean;
}

export interface BroadcastMessage {
  type: string;
  payload: unknown;
}
