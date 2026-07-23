import $appdata from "@/helpers/AppData";
import $popup from "@/helpers/Popup";

async function call(path) {
  const response = await fetch(`/api/egw/${path}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Falha ao consultar a EGW Writings API (${response.status})`);
  }
  return data;
}

export default {
  async books(lang = "pt", limit = 100, page = null) {
    const params = new URLSearchParams({ lang, limit: String(limit) });
    if (page) params.set("page", page);
    return call(`books?${params}`);
  },

  async toc(bookId) {
    return call(`toc?bookId=${encodeURIComponent(bookId)}`);
  },

  async chapter(bookId, para) {
    return call(`chapter?bookId=${encodeURIComponent(bookId)}&para=${encodeURIComponent(para)}`);
  },

  async search(query, lang = "pt", limit = 20) {
    const params = new URLSearchParams({ query, lang, limit: String(limit) });
    return call(`search?${params}`);
  },

  /**
   * Remove tags HTML (ex: <mark>, <span class="egwlink">) do texto vindo
   * da API, mantendo só o texto puro para exibir/projetar.
   */
  stripHtml(html) {
    if (!html) return "";
    const el = document.createElement("div");
    el.innerHTML = html;
    return el.textContent || el.innerText || "";
  },

  /**
   * Projeta uma citação de Ellen G. White reaproveitando o mesmo canal
   * de projeção "texto + referência" já usado pela Bíblia — mesma tela
   * de segunda tela, com todas as opções de customização já existentes.
   */
  project(text, reference) {
    $appdata.set("modules.bible.data.text", text);
    $appdata.set("modules.bible.data.scriptural_reference", reference);
    $popup.open("bible");
  },
};
