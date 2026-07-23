import $appdata from "@/helpers/AppData";
import $media from "@/helpers/Media";

/**
 * Deriva o que deveria aparecer no espelho a partir do MESMO estado que já
 * alimenta a tela de projeção (views/Popup.vue) — não existe um "estado do
 * espelho" separado, é sempre um reflexo do que já está sendo projetado.
 */
export function currentMirrorState() {
  const popupModule = $appdata.get("popup_module");
  const isPopupOpen = !!$appdata.get("popup");

  if (!isPopupOpen) {
    return { type: "idle", title: "", text: "", reference: "" };
  }

  if (popupModule == "media") {
    const config = $media.config();
    const slide = $media.slide();
    if (!slide) {
      return { type: "idle", title: "", text: "", reference: "" };
    }
    return {
      type: "song",
      title: config?.title || "",
      text: slide.cover ? "" : (slide.lyric || "").replace(/<br\s*\/?>/gi, "\n"),
      reference: "",
    };
  }

  if (popupModule == "bible") {
    return {
      type: "bible",
      title: "",
      text: $appdata.get("modules.bible.data.text") || "",
      reference: $appdata.get("modules.bible.data.scriptural_reference") || "",
    };
  }

  // "link" (YouTube/mídia) não tem uma representação de texto sensata para
  // espelhar num celular — o espectador só vê que algo está sendo exibido.
  if (popupModule == "link") {
    return { type: "media", title: "", text: "", reference: "" };
  }

  return { type: "idle", title: "", text: "", reference: "" };
}
