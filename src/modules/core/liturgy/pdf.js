import jsPDF from "jspdf";

const TYPE_LABELS = {
  song: "Música",
  bible: "Versículo",
  link: "Link",
  media: "Mídia",
};

/**
 * Gera um PDF com a programação dos dias selecionados.
 *
 * @param {string[]} days - ids dos dias (ex: "monday") a incluir, na ordem desejada
 * @param {object} liturgyData - dado completo do helper Liturgy (um board por dia)
 * @param {Record<string,string>} dayLabels - id do dia -> nome traduzido
 * @param {string} title - título do documento
 */
export function generateLiturgyPdf(days, liturgyData, dayLabels, title) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 50;

  function ensureSpace(height) {
    if (y + height > pageHeight - 40) {
      doc.addPage();
      y = 50;
    }
  }

  days.forEach((day, dayIndex) => {
    if (dayIndex > 0) {
      doc.addPage();
    }
    y = 50;

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text(title, marginX, y);
    doc.setFont(undefined, "normal");
    y += 16;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, marginX, y);
    doc.setTextColor(0);
    y += 26;

    const board = liturgyData[day];

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(dayLabels[day] || day, marginX, y);
    doc.setFont(undefined, "normal");
    y += 22;

    const columnsWithCards = (board?.columns || []).filter((c) => c.cards.length);

    if (!columnsWithCards.length) {
      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text("Nada planejado para este dia.", marginX, y);
      doc.setTextColor(0);
      return;
    }

    columnsWithCards.forEach((column) => {
      ensureSpace(30);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text(column.name, marginX, y);
      doc.setFont(undefined, "normal");
      y += 18;

      column.cards.forEach((card, idx) => {
        ensureSpace(28);
        doc.setFontSize(11);
        const label = TYPE_LABELS[card.type] || card.type;
        doc.text(`${idx + 1}. [${label}] ${card.title}`, marginX + 10, y);
        y += 15;

        if (card.subtitle) {
          doc.setFontSize(9);
          doc.setTextColor(120);
          const lines = doc.splitTextToSize(card.subtitle, pageWidth - marginX * 2 - 20);
          lines.forEach((line) => {
            ensureSpace(12);
            doc.text(line, marginX + 20, y);
            y += 12;
          });
          doc.setTextColor(0);
        }
      });
      y += 10;
    });
  });

  return doc;
}
