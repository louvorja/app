import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";

const NIGHT_START_HOUR = 18; // 18:00
const NIGHT_END_HOUR = 6; // 06:00
const NIGHT_THEME = "dark";
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export default {
  primary() {
    return !$appdata.get("is_dark") ? "primary" : undefined;
  },

  isNightTime(date = new Date()) {
    const hour = date.getHours();
    return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
  },

  isAutoEnabled() {
    return !!$userdata.get("theme_auto");
  },

  /**
   * Liga o tema automático dia/noite, guardando o tema atual como o
   * "tema de dia" a ser restaurado quando não for mais horário noturno.
   */
  enableAuto(vuetifyTheme) {
    const current = vuetifyTheme.global.name.value ?? vuetifyTheme.global.name;
    if (current !== NIGHT_THEME) {
      $userdata.set("theme_auto_day", current);
    }
    $userdata.set("theme_auto", true);
    this.applyAutoTheme(vuetifyTheme);
  },

  disableAuto() {
    $userdata.set("theme_auto", false);
  },

  /**
   * Aplica o tema certo para a hora atual, se o modo automático estiver
   * ligado. Chamado ao carregar o app e periodicamente depois (para pegar
   * a virada dia/noite numa sessão que fica aberta por horas).
   */
  applyAutoTheme(vuetifyTheme) {
    if (!this.isAutoEnabled()) return;

    const dayTheme = $userdata.get("theme_auto_day") || "darkblue";
    const target = this.isNightTime() ? NIGHT_THEME : dayTheme;
    const current = vuetifyTheme.global.name.value ?? vuetifyTheme.global.name;

    if (current !== target) {
      vuetifyTheme.change(target);
      $appdata.set("is_dark", vuetifyTheme.global.current.dark);
    }
  },

  startAutoCheck(vuetifyTheme) {
    this.applyAutoTheme(vuetifyTheme);
    setInterval(() => this.applyAutoTheme(vuetifyTheme), CHECK_INTERVAL_MS);
  },
};
