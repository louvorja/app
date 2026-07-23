import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";
import $media from "@/helpers/Media";
import $popup from "@/helpers/Popup";

const STORAGE_KEY = "liturgy_boards";

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultColumns() {
  return [
    { id: uid(), name: "Abertura" },
    { id: uid(), name: "Louvor" },
    { id: uid(), name: "Palavra" },
    { id: uid(), name: "Encerramento" },
  ].map((column) => ({ ...column, cards: [] }));
}

function defaultData() {
  const data = {};
  WEEKDAYS.forEach((day) => {
    data[day] = { columns: defaultColumns() };
  });
  return data;
}

export default {
  uid,
  WEEKDAYS,

  load() {
    const data = $storage.get(STORAGE_KEY, defaultData());

    // Garante que todos os dias existam, mesmo que o dado salvo seja antigo
    WEEKDAYS.forEach((day) => {
      if (!data[day] || !Array.isArray(data[day].columns)) {
        data[day] = { columns: defaultColumns() };
      }
    });

    return data;
  },

  save(data) {
    $storage.set(STORAGE_KEY, data);
  },

  /**
   * Serializa toda a liturgia (todos os dias) para um arquivo de backup
   * que pode ser importado depois, no mesmo computador ou em outro.
   */
  exportData(data) {
    return JSON.stringify(
      {
        app: "louvorja",
        type: "liturgy_export",
        version: 1,
        exported_at: new Date().toISOString(),
        data,
      },
      null,
      2,
    );
  },

  /**
   * Lê o conteúdo de um arquivo exportado por exportData() (ou o formato
   * bruto, para compatibilidade) e devolve um objeto de liturgia válido,
   * preenchendo com o padrão qualquer dia ausente ou inválido.
   */
  importData(jsonText) {
    const parsed = JSON.parse(jsonText);
    const data = parsed && typeof parsed === "object" && parsed.data ? parsed.data : parsed;

    const result = {};
    WEEKDAYS.forEach((day) => {
      result[day] =
        data?.[day] && Array.isArray(data[day].columns)
          ? data[day]
          : { columns: defaultColumns() };
    });
    return result;
  },

  addColumn(board, name) {
    board.columns.push({ id: uid(), name, cards: [] });
  },

  removeColumn(board, columnId) {
    const index = board.columns.findIndex((column) => column.id === columnId);
    if (index >= 0) {
      board.columns.splice(index, 1);
    }
  },

  renameColumn(board, columnId, name) {
    const column = board.columns.find((column) => column.id === columnId);
    if (column) {
      column.name = name;
    }
  },

  newCard(type, payload, notes = "") {
    return {
      id: uid(),
      type,
      title: payload.title,
      subtitle: payload.subtitle || "",
      payload,
      notes,
    };
  },

  /**
   * Envia o conteúdo do card para o módulo responsável e abre a
   * exibição pública (segunda tela) nesse módulo.
   */
  play(card) {
    switch (card.type) {
      case "song":
        $media.open({
          id_music: card.payload.id_music,
          mode: card.payload.mode || "audio",
        });
        $popup.open("media");
        break;

      case "bible":
        $appdata.set("modules.bible.data.text", card.payload.text);
        $appdata.set(
          "modules.bible.data.scriptural_reference",
          card.payload.scriptural_reference,
        );
        $popup.open("bible");
        break;

      case "link":
      case "media":
        $appdata.set("modules.link.data", {
          kind: card.payload.kind,
          url: card.payload.url,
        });
        $popup.open("link");
        break;

      case "sermon":
        $appdata.set("modules.sermon.data", {
          id: card.id,
          title: card.payload.title,
          text: card.payload.text,
          sermon_title: card.payload.sermon_title,
        });
        $popup.open("sermon");
        break;
    }
  },
};
