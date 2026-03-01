import $appdata from "@/helpers/AppData";
import $window from "@/helpers/Window";

let popup = null;

export default {
  async open(params) {
    if (typeof params != "object") {
      params = { module: params };
    }

    popup = $appdata.get("popup");
    if (popup && !popup.closed) {
      popup.focus();
    } else {
      popup = $window.open("/popup", "PopupWindow", "width=800,height=600");
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
