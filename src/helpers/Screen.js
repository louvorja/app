import $userdata from "@/helpers/UserData";

export default {
  isSupported() {
    return typeof window.getScreenDetails === "function";
  },

  async listScreens() {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const details = await window.getScreenDetails();
      return details.screens.map((screen, index) => ({
        key: `${screen.left}:${screen.top}`,
        label: screen.label || `${index + 1}`,
        left: screen.left,
        top: screen.top,
        width: screen.width,
        height: screen.height,
        isPrimary: !!screen.isPrimary,
        isCurrent: screen === details.currentScreen,
      }));
    } catch {
      // Permissão negada ou API indisponível no contexto atual
      return [];
    }
  },

  saveSelectedScreen(screen) {
    $userdata.set("projection_screen", {
      left: screen.left,
      top: screen.top,
    });
  },

  clearSelectedScreen() {
    $userdata.set("projection_screen", null);
  },

  async getPreferredScreen() {
    const screens = await this.listScreens();
    if (screens.length === 0) {
      return null;
    }

    const saved = $userdata.get("projection_screen");
    if (saved) {
      const found = screens.find(
        (screen) => screen.left === saved.left && screen.top === saved.top,
      );
      if (found) {
        return found;
      }
    }

    // Sem preferência salva: assume que a tela estendida (não-primária)
    // é a do projetor/TV, e a tela primária é a do operador.
    return screens.find((screen) => !screen.isPrimary) || screens[0];
  },
};
