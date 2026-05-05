/** @category helper-puro — Limpeza e ordenação de strings UTF-8. Sem APIs Vue; sem acesso ao store. */
export default {
  clean(text: string): string {
    text = text || "";

    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");
  },
  sort(a: string | number, b: string | number): number {
    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }

    const strA = String(a || "");
    const strB = String(b || "");

    return strA
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .localeCompare(
        strB
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
      );
  },
};
