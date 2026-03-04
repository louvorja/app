import $appdata from "@/helpers/AppData";
import $window from "@/helpers/Window";
import $userdata from "@/helpers/UserData";

export default {
  async open(params) {
    if (typeof params != "object") {
      params = { module: params };
    }

    const module = params.module;
    const multiplePopups = $userdata.get("multiple_popups", false);
    const popups = $appdata.get("popups") || {};

    if (multiplePopups) {
      let popup = popups[module];
      if (popup && !popup.closed) {
        popup.focus();
      } else {
        popup = $window.open(
          `/popup?module=${module}`,
          `Popup_${module}`,
          "width=800,height=600"
        );
        popups[module] = popup;
        $appdata.set("popups", popups);
      }
    } else {
      // Single popup mode (current behavior)
      let popup = $appdata.get("popup_instance"); // Using a separate key for the instance to avoid confusion with popups object
      if (popup && !popup.closed) {
        popup.focus();
      } else {
        popup = $window.open("/popup", "PopupWindow", "width=800,height=600");
        $appdata.set("popup_instance", popup);
      }
    }

    $appdata.set("popup_module", module);
  },
  async exit() {
    $appdata.set("popup_module", "");
  },
  async close(module = null) {
    const multiplePopups = $userdata.get("multiple_popups", false);
    if (multiplePopups && module) {
      const popups = $appdata.get("popups") || {};
      if (popups[module]) {
        popups[module].close();
        delete popups[module];
        $appdata.set("popups", popups);
      }
    } else if (!multiplePopups) {
      const popup = $appdata.get("popup_instance");
      if (popup) {
        popup.close();
        $appdata.set("popup_instance", null);
      }
      await this.exit();
    } else {
      // Close all if multiple and no module specified
      const popups = $appdata.get("popups") || {};
      Object.keys(popups).forEach((key) => {
        if (popups[key] && !popups[key].closed) {
          popups[key].close();
        }
      });
      $appdata.set("popups", {});
      await this.exit();
    }
  },
};
