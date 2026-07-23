import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";
import $popup from "@/helpers/Popup";

const STORAGE_KEY = "sermons";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newPoint(title = "", text = "") {
  return { id: uid(), title, text };
}

function newSermon(title = "") {
  return {
    id: uid(),
    title,
    date: new Date().toISOString().slice(0, 10),
    points: [newPoint()],
  };
}

export default {
  uid,
  newPoint,
  newSermon,

  load() {
    return $storage.get(STORAGE_KEY, []);
  },

  save(sermons) {
    $storage.set(STORAGE_KEY, sermons);
  },

  isPlaying(point) {
    if (!$appdata.get("popup") || $appdata.get("popup_module") != "sermon") {
      return false;
    }
    return $appdata.get("modules.sermon.data.id") == point?.id;
  },

  play(sermon, point) {
    $appdata.set("modules.sermon.data", {
      id: point.id,
      title: point.title,
      text: point.text,
      sermon_title: sermon.title,
    });
    $popup.open("sermon");
  },
};
