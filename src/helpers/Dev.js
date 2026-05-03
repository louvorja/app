import $appdata from "@/helpers/AppData";
import $alert from "@/helpers/Alert";

export default {
  write() {
    if (this.debug()) {
      console.log(...Array.from(arguments), " << ");
    }
  },
  debug() {
    const is_dev = $appdata.get("is_dev");
    return is_dev;
  },
  toggle() {
    const is_dev = $appdata.get("is_dev");
    $appdata.set("is_dev", !is_dev);
    $alert.info(
      "messages." +
        (is_dev ? "developer_mode_disabled" : "developer_mode_enabled")
    );
  },

  /** @deprecated Use `toggle` (correct spelling). Will be removed in a future release. */
  toogle() {
    if (import.meta.env.DEV && !this._toogleWarned) {
      console.warn("[Dev] toogle() is deprecated; use toggle() instead.");
      this._toogleWarned = true;
    }
    return this.toggle();
  },
};
