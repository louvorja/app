import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";
import $popup from "@/helpers/Popup";

const STORAGE_KEY = "announcements";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newAnnouncement() {
  return {
    id: uid(),
    title: "",
    text: "",
    image: "",
    created_at: new Date().toISOString(),
  };
}

export default {
  uid,
  newAnnouncement,

  load() {
    return $storage.get(STORAGE_KEY, []);
  },

  save(items) {
    $storage.set(STORAGE_KEY, items);
  },

  isPlaying(item) {
    return (
      !!$appdata.get("popup") &&
      $appdata.get("popup_module") == "announcement" &&
      $appdata.get("modules.announcement.data.id") == item?.id
    );
  },

  play(item) {
    $appdata.set("modules.announcement.data", {
      id: item.id,
      title: item.title,
      text: item.text,
      image: item.image,
    });
    $popup.open("announcement");
  },

  /**
   * Serializa todos os recados para um arquivo que pode ser importado
   * depois, no mesmo computador ou em outro (inclui as imagens em base64).
   */
  exportData(items) {
    return JSON.stringify(
      {
        app: "louvorja",
        type: "announcements_export",
        version: 1,
        exported_at: new Date().toISOString(),
        data: items,
      },
      null,
      2,
    );
  },

  importData(jsonText) {
    const parsed = JSON.parse(jsonText);
    const data =
      parsed && typeof parsed === "object" && Array.isArray(parsed.data)
        ? parsed.data
        : parsed;
    if (!Array.isArray(data)) {
      throw new Error("Invalid announcements file");
    }
    return data;
  },
};
