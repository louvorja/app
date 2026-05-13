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
    if (this.isFavorite(id_music)) {
      $dev.write("favorites: já é favorito", { id_music });
      return;
    }
    const favorites = [...this.list()];

    favorites.push({
      id_music,
      name,
      has_instrumental_music,
    });

    $dev.write("favorites:antes de salvar", { count: favorites.length, id_music });
    $userdata.set("favorites", favorites);
    $dev.write("favorites:add", { id_music, name, count: favorites.length });
  },

  remove(id_music) {
    const favorites = this.list().filter((f) => f.id_music !== id_music);
    $dev.write("favorites:antes de remover", { count: favorites.length, id_music });
    $userdata.set("favorites", favorites);
    $dev.write("favorites:remove", { id_music, count: favorites.length });
  },

  toggle(id_music, name, has_instrumental_music = false) {
    if (this.isFavorite(id_music)) {
      this.remove(id_music);
    } else {
      this.add(id_music, name, has_instrumental_music);
    }
  },

  reorder(newList) {
    $dev.write("favorites:antes de reordenar", { count: newList.length });
    $userdata.set("favorites", newList);
    $dev.write("favorites:reorder", { count: newList.length });
  },
};
