/** @category deve-virar-composable — Usa UserData (Pinia); requer renderer inicializado. */
import $userdata from "@/helpers/UserData";
import $dev from "@/helpers/Dev";

export default {
  list() {
    return $userdata.get("favorites", []);
  },

  isFavorite(id_music) {
    return this.list().some((f) => f.id_music === id_music);
  },

  add(id_music, name, has_instrumental_music = false) {
    if (this.isFavorite(id_music)) return;
    const favorites = this.list();
    favorites.push({ id_music, name, has_instrumental_music });
    $userdata.set("favorites", favorites);
    $dev.write("favorites:add", { id_music, name });
  },

  remove(id_music) {
    const favorites = this.list().filter((f) => f.id_music !== id_music);
    $userdata.set("favorites", favorites);
    $dev.write("favorites:remove", { id_music });
  },

  toggle(id_music, name, has_instrumental_music = false) {
    if (this.isFavorite(id_music)) {
      this.remove(id_music);
    } else {
      this.add(id_music, name, has_instrumental_music);
    }
  },

  reorder(newList) {
    $userdata.set("favorites", newList);
    $dev.write("favorites:reorder", newList.length);
  },
};
