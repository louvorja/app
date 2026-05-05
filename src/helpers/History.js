/** @category deve-virar-composable — Usa UserData (Pinia); requer renderer inicializado. */
import $userdata from "@/helpers/UserData";

const MAX = 50;

export default {
  list() {
    return $userdata.get("history", []);
  },

  add(id_music, name, has_instrumental_music = false) {
    let history = this.list().filter((h) => h.id_music !== id_music);
    history.unshift({ id_music, name, has_instrumental_music, opened_at: Date.now() });
    if (history.length > MAX) history = history.slice(0, MAX);
    $userdata.set("history", history);
  },

  remove(id_music) {
    $userdata.set(
      "history",
      this.list().filter((h) => h.id_music !== id_music)
    );
  },

  clear() {
    $userdata.set("history", []);
  },
};
