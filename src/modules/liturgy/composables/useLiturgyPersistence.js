import { ref, computed, getCurrentInstance } from "vue";
import $liturgy, { weekBounds } from "@/helpers/Liturgy";
import $userdata from "@/helpers/UserData";
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

export function useLiturgyPersistence() {
  const inst = getCurrentInstance();
  const t = (key) => _t(key, inst?.proxy?.$i18n?.locale || "pt");

  const activeWeek = ref($liturgy.getActiveWeek());
  const locked = ref($userdata.get("modules.liturgy.locked", false));
  const showNotes = ref(false);
  const noteDayIndex = ref(new Date().getDay());
  const schedulesDialog = ref(false);
  const activeCatId = ref(null);
  const editingCatId = ref(null);
  const editingCatName = ref("");

  // Caches reativos de scheduled (evita $forceUpdate)
  const _scheduledCategoriesCache = ref([]);
  const _scheduledItemsCache = ref([]);

  function _refreshScheduled() {
    _scheduledCategoriesCache.value = $liturgy.scheduledCategories();
    _scheduledItemsCache.value = $liturgy.scheduledItems();
  }
  _refreshScheduled();

  const scheduledCategories = computed(() => _scheduledCategoriesCache.value);

  const activeCategory = computed(
    () => _scheduledCategoriesCache.value.find((c) => c.id === activeCatId.value) || null
  );

  const categoryItems = computed(() => {
    if (!activeCatId.value) return [];
    return _scheduledItemsCache.value
      .filter((i) => i.categoria === activeCatId.value)
      .sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  });

  const noteDays = computed(() => {
    const lang = inst?.proxy?.$i18n?.locale || "pt";
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.pt;
    return dict.notes?.days || ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  });

  const currentNote = computed(() => $liturgy.getWeekdayNote(noteDayIndex.value, activeWeek.value));

  /* ============== Semana ============== */
  function onWeekChange(e) {
    const val = e.target.value;
    if (!val) return;
    activeWeek.value = val;
    $liturgy.setActiveWeek(val);
  }

  function changeWeek(delta) {
    const { monday } = weekBounds(activeWeek.value);
    monday.setUTCDate(monday.getUTCDate() + delta * 7);
    const d = new Date(monday);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const newWeek = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    const pad = (n) => String(n).padStart(2, "0");
    const newWeekStr = `${d.getUTCFullYear()}-W${pad(newWeek)}`;
    activeWeek.value = newWeekStr;
    $liturgy.setActiveWeek(newWeekStr);
  }

  /* ============== Bloqueio ============== */
  function toggleLock() {
    locked.value = !locked.value;
    $userdata.set("modules.liturgy.locked", locked.value);
  }

  /* ============== Anotações ============== */
  function onNoteInput(e) {
    $liturgy.setWeekdayNote(noteDayIndex.value, e.target.value, activeWeek.value);
  }

  /* ============== Itens Agendados ============== */
  function openSchedulesDialog() {
    schedulesDialog.value = true;
    if (!activeCatId.value && _scheduledCategoriesCache.value.length) {
      activeCatId.value = _scheduledCategoriesCache.value[0].id;
    }
  }

  function addCategory() {
    const nome = prompt(t("schedules.new_category"));
    if (!nome || !nome.trim()) return;
    const id = $liturgy.addScheduledCategory(nome.trim());
    _refreshScheduled();
    activeCatId.value = id;
  }

  function startEditingCategory(c) {
    editingCatId.value = c.id;
    editingCatName.value = c.nome;
  }

  function setActiveCatId(id) {
    activeCatId.value = id;
  }

  function setNoteDayIndex(i) {
    noteDayIndex.value = i;
  }

  function toggleNotes() {
    showNotes.value = !showNotes.value;
  }

  function saveCategoryName(id, name) {
    const trimmed = (name ?? editingCatName.value).trim();
    if (trimmed) {
      $liturgy.updateScheduledCategory(id, { nome: trimmed });
      _refreshScheduled();
    }
    editingCatId.value = null;
  }

  function removeCategory(id) {
    if (!confirm(t("schedules.remove_category_confirm"))) return;
    $liturgy.removeScheduledCategory(id);
    _refreshScheduled();
    if (activeCatId.value === id) activeCatId.value = null;
  }

  function addScheduledItem() {
    if (!activeCatId.value) return;
    const today = new Date().toISOString().slice(0, 10);
    $liturgy.addScheduledItemEntry(activeCatId.value, today, "", "");
    _refreshScheduled();
  }

  function updateScheduled(it) {
    $liturgy.updateScheduledItemEntry(it.id, {
      data: it.data,
      nome: it.nome,
      arquivo: it.arquivo,
      arquivo_info: it.arquivo_info,
    });
    _refreshScheduled();
  }

  function removeScheduled(id) {
    if (!confirm(t("dialog.remove_confirm"))) return;
    $liturgy.removeScheduledItemEntry(id);
    _refreshScheduled();
  }

  /* ============== Save/Load JSON ============== */
  function saveFile() {
    const data = $liturgy.exportJson(activeWeek.value);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liturgia-${activeWeek.value}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = $liturgy.importJson(ev.target.result, activeWeek.value);
      if (!ok) alert(t("dialog.invalid_file"));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return {
    activeWeek,
    locked,
    showNotes,
    noteDayIndex,
    schedulesDialog,
    activeCatId,
    editingCatId,
    editingCatName,
    scheduledCategories,
    activeCategory,
    categoryItems,
    noteDays,
    currentNote,
    setActiveCatId,
    setNoteDayIndex,
    toggleNotes,
    onWeekChange,
    changeWeek,
    toggleLock,
    onNoteInput,
    openSchedulesDialog,
    addCategory,
    startEditingCategory,
    saveCategoryName,
    removeCategory,
    addScheduledItem,
    updateScheduled,
    removeScheduled,
    saveFile,
    onFileLoad,
  };
}
