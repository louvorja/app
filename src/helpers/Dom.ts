export function scrollToElement(el: Element | null | undefined, opts: ScrollIntoViewOptions = {}): void {
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center", ...opts });
}
