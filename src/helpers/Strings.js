export default {
  clean(text) {
    text = text || "";

    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  },
  sort(a, b) {
    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }

    a = a || "";
    b = b || "";

    return a
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .localeCompare(
        b
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );
  },
};
