/**
 * BroadcastTypes — contratos do canal BroadcastChannel("louvorja").
 *
 * Usar BROADCAST_TYPE.* em vez de strings literais em emissores e receptores.
 *
 * Categorias:
 *   - Cross-window: funcionam entre janelas/abas do mesmo origin. No Electron
 *     (>= 41) também cruzam BrowserWindows desde que sandbox: false e mesma
 *     origem (garantido em windowFactory.js). Ver docs/broadcast.md.
 *     Para sync de UserData usamos canal duplo (broadcast + IPC) por
 *     resiliência — alguns drivers podem ser flaky.
 *   - In-app: emitidos por hotkeys/HTTP e consumidos na mesma janela.
 *   - Planejado: definido mas ainda não emitido; reservado para uso futuro.
 * @category helper-puro — Só tipos e constantes; sem APIs Vue.
 */

export const BROADCAST_TYPE = Object.freeze({
  // ─── Cross-window ────────────────────────────────────────────────────────

  /** Estado atual do slide em reprodução. Emitido por Media.js, SlideEditor.
   *  Recebido por: Projection, ProjectionReturn, Obs, Operator. */
  SLIDE_CHANGE: "slide_change",

  /** Atualização contínua (0-100) do progresso do SLIDE atual.
   *  Emitido durante playback (throttle) e recebido por: ProjectionReturn (barra de progresso).
   *  Payload: { slide_index, slide_progress } */
  SLIDE_PROGRESS: "slide_progress",

  /** Carga inicial de slides ao abrir uma música. Emitido por Media.js.
   *  Recebido por: Operator. */
  SLIDES_DATA: "slides_data",

  /** Solicitação de navegação para um slide específico. Emitido por Operator.
   *  Recebido por: Media.js (listener via getElement). */
  GO_TO_SLIDE: "go_to_slide",

  /** Versículo bíblico selecionado. Emitido por bible/Index.vue.
   *  Recebido por: ObsBible, ProjectionBible. */
  BIBLE_VERSE: "bible_verse",

  /** Formatação da Bíblia mudou (cor/fonte/tamanho/fundo). Emitido por
   *  bible/Index.vue ao alterar fmt.*. Recebido por: ProjectionBible. */
  BIBLE_FORMAT_CHANGED: "bible_format_changed",

  /** Ação da ribbon contextual da Bíblia (Limpar Texto, Verso Anterior, etc).
   *  Emitido por: RibbonBar. Recebido por: bible/Index.vue. */
  BIBLE_RIBBON_ACTION: "bible_ribbon_action",

  /** Solicita reemissão do versículo atual da Bíblia. Emitido por
   *  ProjectionBible ao montar — sem isso, janelas que abrem depois ficam
   *  pretas até que o usuário troque de versículo.
   *  Recebido por: bible/Index.vue (re-emite BIBLE_VERSE). */
  REQUEST_BIBLE_STATE: "request_bible_state",

  // ─── Pattern genérico de projeção de módulo ──────────────────────────────

  /** Valor a ser projetado por um módulo qualquer (texto, número, etc.).
   *  Payload: { module: string, text?: string, reference?: string, active?: boolean }
   *  Emitido por: módulos com LScreenBtn (counter, draw, name_draw, message_board,
   *  clock, stopwatch). Recebido por: ModuleProjection. */
  MODULE_PROJECTION_VALUE: "module_projection_value",

  /** Formatação de algum módulo mudou. Payload: { module, key, value }.
   *  Emitido por: useModuleFormat. Recebido por: ModuleProjection. */
  MODULE_FORMAT_CHANGED: "module_format_changed",

  /** Solicita reemissão do estado de um módulo. Payload: { module: string }.
   *  Emitido por: ModuleProjection ao montar. Recebido por: módulo correspondente. */
  REQUEST_MODULE_STATE: "request_module_state",

  /** Ação ribbon contextual de qualquer módulo. Payload: { module, action }.
   *  Emitido por: RibbonBar. Recebido por: módulo correspondente. */
  MODULE_RIBBON_ACTION: "module_ribbon_action",

  /** Texto do painel de recados. Emitido por message_board/Index.vue.
   *  Recebido por: (recepção futura). */
  MESSAGE_BOARD: "message_board",

  /** [planejado] Notificação de fechamento da mídia. Emit: Media.close().
   *  Recebido por: Projection, Obs. (ainda não emitido — ver Media.js). */
  MEDIA_CLOSE: "media_close",

  /** Solicita reemissão do estado atual do slide. Emitido por janelas
   *  secundárias (Popup) ao montar para sincronizar com o estado da janela
   *  principal — sem isso, broadcasts são "fire-and-forget" e janelas que
   *  abrem depois ficam vazias até a próxima troca de slide.
   *  Recebido por: useSlides (re-emite SLIDE_CHANGE). */
  REQUEST_SLIDE_STATE: "request_slide_state",

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

  /** Ação contextual disparada pelo Ribbon global enquanto o módulo Liturgia está ativo.
   *  payload.action ∈ "add" | "check_all" | "uncheck_all" | "invert" | "delete_done"
   *  | "toggle_mark_on_access" | "toggle_show_notes" | "toggle_lock". */
  LITURGY_RIBBON_ACTION: "liturgy:ribbon_action",

  // ─── Sync de userdata cross-window ───────────────────────────────────────

  /** Mudança em UserData (options.*, theme, etc.) propagada de uma janela
   *  para todas as outras (Projection, Operator, ObsBible…). Sem isso, mexer
   *  em "Fundo personalizado" ou "Tamanho de fonte" nas Opções da janela
   *  principal não chega à janela de projeção, porque cada BrowserWindow
   *  tem seu próprio Pinia store.
   *  Payload: { path: string, value: unknown, _src?: string } */
  USERDATA_PATCH: "userdata:patch",
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
  /** Timestamp de emissão (Date.now()) — presente apenas em dev/test para medir latência cross-window. */
  _ts?: number;
}

export interface SlideProgressPayload {
  slide_index: number;
  /** 0-100. */
  slide_progress: number;
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
