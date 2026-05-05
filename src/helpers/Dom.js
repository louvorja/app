export function scrollToElement(el, opts = {}) {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center", ...opts });
}
