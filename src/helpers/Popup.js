import $appdata from "@/helpers/AppData";
import $window from "@/helpers/Window";
import $screen from "@/helpers/Screen";

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
      const target = await $screen.getPreferredScreen();
      const features = target
        ? `left=${target.left},top=${target.top},width=${target.width},height=${target.height}`
        : "width=800,height=600";

      popup = $window.open("/popup", "PopupWindow", features);

      if (target && popup) {
        // Alguns navegadores não respeitam totalmente left/top/width/height
        // no momento da abertura, então reforça a posição/tamanho depois.
        setTimeout(() => {
          try {
            popup.moveTo(target.left, target.top);
            popup.resizeTo(target.width, target.height);
          } catch {
            // Janela pode já ter sido fechada ou o navegador bloqueou a ação
          }
        }, 300);
      }
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
