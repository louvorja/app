/** @category deve-virar-composable — Usa AppData (Pinia); requer renderer inicializado. */
import $appdata from "@/helpers/AppData";

let popup = null;

export default {
  async open(params) {
    if (typeof params != "object") {
      params = { module: params };
    }

    popup = $appdata.get("popup");
    if (popup && !popup.closed) {
      popup.focus();
      // Reaproveita janela existente — sinaliza módulo via postMessage.
      try {
        popup.postMessage({ param: "popup_module", value: params.module }, window.location.origin);
      } catch (_) {
        /* janela pode estar inicializando ainda */
      }
    } else {
      const base = import.meta.env.BASE_URL ?? "/";
      // Passa o módulo via query string para que o popup leia já no mount
      // (cada janela Electron tem seu próprio Pinia store, não dá pra compartilhar via $appdata).
      const url = `${base}popup?module=${encodeURIComponent(params.module)}`;
      popup = window.open(url, "PopupWindow", "width=800,height=600");
    }
    $appdata.set("popup_module", params.module);
    $appdata.set("popup", popup);
  },
  async exit() {
    $appdata.set("popup_module", "");
  },
  async close() {
    popup.close();
    await this.exit();
    $appdata.set("popup", null);
  },
};
