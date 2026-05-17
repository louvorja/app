import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import $liturgy from "@/helpers/Liturgy";
import $media from "@/composables/useMedia";
import $database from "@/helpers/Database";
import $alert from "@/helpers/Alert";
import Platform from "@/helpers/Platform";
import pt from "../lang/pt.json";
import es from "../lang/es.json";

const TRANSLATIONS = { pt, es };

function _t(key, locale) {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.pt;
  const path = key.split(".");
  let cur = dict;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in cur) cur = cur[k];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}

export const COLORS = [
  "#00004F",
  "#1e40af",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#475569",
  "#000000",
  "#ffffff",
];
export const DEFAULT_COLOR = "#00004F";

export const DEFAULT_FORM = () => ({
  id: null,
  tipo: "anotacao",
  item: "",
  subitem: "",
  cor: DEFAULT_COLOR,
  duration: 0,
  dir: "",
  dir_info: "E",
  url: "",
  musica: -1,
  escolha: "0",
  has_instrumental_music: false,
  subtipo: "",
});

/**
 * @param {import('vue').Ref<number>} activeDay
 * @param {import('vue').ComputedRef<Array>} scheduledCategories
 */
export function useLiturgyItems(activeDay, scheduledCategories) {
  const i18n = useI18n();
  const getLocale = () => (typeof i18n.locale.value === "string" ? i18n.locale.value : "pt");
  const t = (key) => _t(key, getLocale());

  const dialog = ref(false);
  const editIndex = ref(-1);
  const form = ref(DEFAULT_FORM());
  const musicsCache = ref(null);
  const isDraggingOver = ref(false);
  const menuOpen = ref(false);

  const items = computed({
    get() {
      return $liturgy.list(activeDay.value);
    },
    set(val) {
      $liturgy.set(val, activeDay.value);
    },
  });

  const totalDuration = computed(() =>
    items.value.reduce((s, i) => s + (Number(i.duration) || 0), 0)
  );

  const musicsList = computed(() => musicsCache.value || []);

  /* ============== Listagem ============== */
  function isChecked(item) {
    return $liturgy.isCheckedToday(item);
  }

  function toggleChecked(item) {
    $liturgy.toggleChecked(item.id, activeDay.value);
    items.value = [...items.value];
  }

  function onReorder(value) {
    items.value = value;
  }

  function iconForItem(item) {
    const map = {
      anotacao: "mdi-note-text-outline",
      arquivo: item.subtipo === "dir" ? "mdi-folder-outline" : "mdi-file-outline",
      site: isYoutube(item.url || item.subitem) ? "mdi-youtube" : "mdi-web",
      musica: "mdi-music",
      itensagendados: "mdi-calendar-multiselect",
      categoria: "mdi-format-section",
    };
    return map[item.tipo] || "mdi-circle-medium";
  }

  function isYoutube(url) {
    if (!url) return false;
    return /youtu\.?be/i.test(url);
  }

  function subtitleFor(item) {
    if (item.tipo === "musica" && item.escolha === "1") return t("placeholders.music_choose");
    return item.subitem || "";
  }

  /* ============== Cor ============== */
  function changeColor(index) {
    const current = items.value[index]?.cor || DEFAULT_COLOR;
    const idx = COLORS.findIndex((c) => c.toLowerCase() === current.toLowerCase());
    const next = COLORS[(idx + 1) % COLORS.length];
    $liturgy.update(items.value[index].id, { cor: next }, activeDay.value);
    items.value = [...items.value];
  }

  /* ============== Ações em massa ============== */
  function markAll(checked) {
    menuOpen.value = false;
    items.value.forEach((item) => {
      if (item.tipo === "categoria") return;
      const isCheckedNow = $liturgy.isCheckedToday(item);
      if (checked !== isCheckedNow) {
        $liturgy.toggleChecked(item.id, activeDay.value);
      }
    });
    items.value = [...items.value];
  }

  function invertSelection() {
    menuOpen.value = false;
    items.value.forEach((item) => {
      if (item.tipo === "categoria") return;
      $liturgy.toggleChecked(item.id, activeDay.value);
    });
    items.value = [...items.value];
  }

  function removeDone() {
    menuOpen.value = false;
    if (!confirm(t("dialog.remove_done_confirm"))) return;
    const toRemove = items.value
      .filter((i) => i.tipo !== "categoria" && $liturgy.isCheckedToday(i))
      .map((i) => i.id);
    toRemove.forEach((id) => $liturgy.remove(id, activeDay.value));
    items.value = [...items.value];
  }

  /* ============== Dialog ============== */
  function openItemDialog(index = -1) {
    editIndex.value = index;
    form.value = index >= 0 ? { ...DEFAULT_FORM(), ...items.value[index] } : DEFAULT_FORM();
    dialog.value = true;
  }

  function quickAdd(tipo) {
    openItemDialog();
    form.value.tipo = tipo;
  }

  function onTypeChange() {
    if (form.value.tipo !== "musica") {
      form.value.musica = -1;
      form.value.escolha = "0";
    }
    if (form.value.tipo === "musica" && form.value.musica === -1) {
      form.value.escolha = "1";
    }
  }

  function setMusicChoice(later) {
    form.value.escolha = later ? "1" : "0";
    if (later) form.value.musica = -1;
  }

  function onMusicChange() {
    const m = musicsList.value.find((x) => x.id_music === form.value.musica);
    if (m) {
      form.value.item = m.name;
      form.value.has_instrumental_music = !!m.has_instrumental_music;
      form.value.escolha = "0";
    }
  }

  function onScheduledCategoryChange() {
    const c = scheduledCategories.value.find((x) => x.id === form.value.id);
    if (c) form.value.item = c.nome;
  }

  function saveItem() {
    const f = form.value;

    if (!f.tipo) {
      $alert?.warning?.({ text: t("dialog.choose_type") });
      return;
    }
    if (f.tipo !== "itensagendados" && !String(f.item || "").trim()) {
      $alert?.warning?.({ text: t("dialog.set_name") });
      return;
    }
    if (f.tipo === "itensagendados" && !f.id) {
      $alert?.warning?.({ text: t("dialog.choose_scheduled") });
      return;
    }

    const built = { ...f };
    if (f.tipo === "anotacao") {
      built.subitem = f.subitem || "";
    } else if (f.tipo === "site") {
      built.url = $liturgy.validateUrl(f.url);
      built.subitem = "Site " + built.url;
    } else if (f.tipo === "arquivo") {
      const isDir = f.dir.endsWith("/") || f.dir.endsWith("\\");
      built.subtipo = isDir ? "dir" : "arq";
      built.subitem = (isDir ? "Pasta " : "Arquivo ") + f.dir;
    } else if (f.tipo === "musica") {
      if (f.escolha === "1" || Number(f.musica) === -1) {
        built.escolha = "1";
        built.musica = -1;
        built.subtipo = "escolha";
        built.subitem = t("placeholders.music_choose");
      } else {
        const m = musicsList.value.find((x) => x.id_music === Number(f.musica));
        built.escolha = "0";
        built.subtipo = built.has_instrumental_music ? "ja" : "div";
        built.subitem = t("data.music_prefix") + " " + (m?.name || `#${f.musica}`);
        built.id_music = Number(f.musica);
      }
    } else if (f.tipo === "itensagendados") {
      const c = scheduledCategories.value.find((x) => x.id === f.id);
      built.item = c?.nome || "";
      built.subitem = "";
    } else if (f.tipo === "categoria") {
      built.subitem = "";
    }

    if (editIndex.value >= 0) {
      const id = items.value[editIndex.value].id;
      $liturgy.update(id, built, activeDay.value);
    } else {
      $liturgy.add(built, activeDay.value);
    }
    items.value = [...items.value];
    dialog.value = false;
  }

  function confirmRemove(index, fromDialog = false) {
    if (!confirm(t("dialog.remove_confirm"))) return;
    const id = items.value[index].id;
    $liturgy.remove(id, activeDay.value);
    items.value = [...items.value];
    if (fromDialog) dialog.value = false;
  }

  function cloneItem(index) {
    if (index < 0 || index >= items.value.length) return;

    const itemToClone = items.value[index];

    const { id, checked_days, ...cloned } = itemToClone;

    $liturgy.insert(cloned, activeDay.value, index + 1);

    items.value = $liturgy.list(activeDay.value);
  }

  function confirmClear(stopTimer) {
    if (!items.value.length) return;
    if (!confirm(t("dialog.clear_confirm"))) return;
    $liturgy.clear(activeDay.value);
    items.value = [];
    if (stopTimer) stopTimer();
  }

  /* ============== Execução do item ============== */
  function executeItem(item) {
    if (item.tipo === "musica") {
      playMusic(item, "sung");
    } else if (item.tipo === "site") {
      openUrl(item.url);
    } else if (item.tipo === "arquivo") {
      openFile(item);
    } else if (item.tipo === "itensagendados") {
      const sched = $liturgy.findScheduledForToday(item.id);
      if (sched && sched.arquivo) openUrl(sched.arquivo);
      else alert(t("dialog.scheduled_not_found"));
    } else if (item.tipo === "anotacao") {
      alert(item.item + (item.subitem ? "\n\n" + item.subitem : ""));
    }
  }

  function playMusic(item, mode = "sung") {
    if (item.escolha === "1" || !item.id_music) {
      alert(t("dialog.music_choose_first"));
      return;
    }
    const map = {
      sung: { id_music: item.id_music, mode: "audio" },
      pb: { id_music: item.id_music, mode: "instrumental" },
      lyric: { id_music: item.id_music, mode: "no_audio" },
      no_audio: { id_music: item.id_music, mode: "no_audio" },
    };
    $media.open(map[mode] || map.sung);
  }

  // Abre a visualização da letra (usa useMedia.openLyric)
  function openLyric(musica) {
    if (!musica || Number.isNaN(musica) || musica === -1) {
      // mantém a mesma mensagem usada em playMusic
      alert(t("dialog.music_choose_first"));
      return;
    }

    // Chama o composable de mídia para abrir a letra
    $media.openLyric({ id_music: musica }).catch((err) => {
      console.warn("[useLiturgyItems] openLyric falhou:", err);
    });
  }

  function openUrl(url) {
    if (!url) return;
    const valid = $liturgy.validateUrl(url);
    window.open(valid, "_blank", "noopener,noreferrer");
  }

  function openFile(item) {
    if (Platform.isDesktop && Platform.api?.openPath) {
      Platform.api.openPath(item.dir);
    } else {
      openUrl(item.dir);
    }
  }

  function openSite() {
    openUrl(form.value.url);
  }

  /* ============== Browse arquivo/pasta ============== */
  async function chooseFolder() {
    if (Platform.isDesktop && Platform.api?.chooseFolder) {
      const dir = await Platform.api.chooseFolder();
      if (dir) form.value.dir = dir + (dir.endsWith("/") || dir.endsWith("\\") ? "" : "/");
    } else {
      alert(t("dialog.desktop_only"));
    }
  }

  async function chooseFile() {
    if (Platform.isDesktop && Platform.api?.chooseFile) {
      const file = await Platform.api.chooseFile();
      if (file) form.value.dir = file;
    } else {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.onchange = (e) => {
        const f = e.target.files[0];
        if (f) form.value.dir = f.name;
      };
      inp.click();
    }
  }

  /* ============== Drag-and-drop de arquivos externos ============== */
  function onDragOver(e) {
    if (
      e.dataTransfer.types.includes("Files") ||
      e.dataTransfer.types.includes("application/x-moz-file")
    ) {
      isDraggingOver.value = true;
    }
  }

  function onDragLeave(el, e) {
    if (!el?.contains(e.relatedTarget)) {
      isDraggingOver.value = false;
    }
  }

  async function onDrop(e) {
    isDraggingOver.value = false;
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    for (const file of files) {
      await _addDroppedFile(file, e);
    }
    items.value = [...items.value];
  }

  async function _addDroppedFile(file, e) {
    const name = file.name;
    const ext = name.split(".").pop().toLowerCase();
    const textExts = ["txt", "rtf"];

    if (e.dataTransfer.items) {
      const entries = Array.from(e.dataTransfer.items);
      for (const dtItem of entries) {
        if (dtItem.webkitGetAsEntry) {
          const entry = dtItem.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            $liturgy.add(
              {
                tipo: "arquivo",
                item: entry.name,
                subitem: "Pasta " + entry.name,
                subtipo: "dir",
                dir: entry.name + "/",
                dir_info: "E",
                cor: DEFAULT_COLOR,
              },
              activeDay.value
            );
            return;
          }
        }
      }
    }

    if (textExts.includes(ext)) {
      const text = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result || "");
        reader.onerror = () => resolve("");
        reader.readAsText(file);
      });
      $liturgy.add(
        {
          tipo: "anotacao",
          item: name.replace(/\.[^.]+$/, ""),
          subitem: text.slice(0, 2000),
          cor: DEFAULT_COLOR,
        },
        activeDay.value
      );
    } else {
      $liturgy.add(
        {
          tipo: "arquivo",
          item: name.replace(/\.[^.]+$/, ""),
          subitem: "Arquivo " + name,
          subtipo: "arq",
          dir: name,
          dir_info: "E",
          cor: DEFAULT_COLOR,
        },
        activeDay.value
      );
    }
  }

  /* ============== Music list ============== */
  async function loadMusicsList() {
    try {
      const data = await $database.get(`${getLocale()}_musics`);
      musicsCache.value = Array.isArray(data) ? data : data?.data || [];
    } catch {
      musicsCache.value = [];
    }
  }

  function setFormField(field, value) {
    form.value[field] = value;
  }

  function toggleMenuOpen() {
    menuOpen.value = !menuOpen.value;
  }

  function closeMenu() {
    menuOpen.value = false;
  }

  return {
    dialog,
    editIndex,
    form,
    musicsCache,
    isDraggingOver,
    menuOpen,
    items,
    totalDuration,
    musicsList,
    isChecked,
    toggleChecked,
    onReorder,
    iconForItem,
    isYoutube,
    subtitleFor,
    changeColor,
    markAll,
    invertSelection,
    removeDone,
    openItemDialog,
    quickAdd,
    onTypeChange,
    setMusicChoice,
    onMusicChange,
    onScheduledCategoryChange,
    saveItem,
    confirmRemove,
    cloneItem,
    confirmClear,
    executeItem,
    playMusic,
    openLyric,
    openUrl,
    openFile,
    openSite,
    chooseFolder,
    chooseFile,
    onDragOver,
    onDragLeave,
    onDrop,
    loadMusicsList,
    setFormField,
    toggleMenuOpen,
    closeMenu,
  };
}
