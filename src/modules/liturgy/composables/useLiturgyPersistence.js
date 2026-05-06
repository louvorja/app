import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import $liturgy from "@/helpers/Liturgy";
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
  const i18n = useI18n();
  const getLocale = () => (typeof i18n.locale.value === "string" ? i18n.locale.value : "pt");
  const t = (key) => _t(key, getLocale());

  // Sempre inicia no dia de hoje (não restaura último selecionado).
  const activeDay = ref(new Date().getDay());
  $liturgy.setActiveDay(activeDay.value);

  const locked = ref($userdata.get("modules.liturgy.locked", false));
  const showNotes = ref($userdata.get("modules.liturgy.show_notes", true));
  const markOnAccess = ref($userdata.get("modules.liturgy.mark_on_access", true));
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
    const dict = TRANSLATIONS[getLocale()] || TRANSLATIONS.pt;
    return dict.notes?.days || ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  });

  const currentNote = computed(() => $liturgy.getDayNote(activeDay.value) ?? "");

  /* ============== Dia ativo ============== */
  function setActiveDay(i) {
    const idx = Math.max(0, Math.min(6, Number(i)));
    activeDay.value = idx;
    $liturgy.setActiveDay(idx);
  }

  /* ============== Bloqueio ============== */
  function toggleLock() {
    locked.value = !locked.value;
    $userdata.set("modules.liturgy.locked", locked.value);
  }

  /* ============== Anotações ============== */
  function setNote(html) {
    $liturgy.setDayNote(activeDay.value, html ?? "");
  }

  function onNoteInput(e) {
    const target = e?.target;
    const html = target?.innerHTML ?? target?.value ?? "";
    setNote(html);
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

  function toggleNotes() {
    showNotes.value = !showNotes.value;
    $userdata.set("modules.liturgy.show_notes", showNotes.value);
  }

  function toggleMarkOnAccess() {
    markOnAccess.value = !markOnAccess.value;
    $userdata.set("modules.liturgy.mark_on_access", markOnAccess.value);
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

  return {
    activeDay,
    setActiveDay,
    locked,
    showNotes,
    markOnAccess,
    toggleMarkOnAccess,
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
    toggleNotes,
    toggleLock,
    setNote,
    onNoteInput,
    openSchedulesDialog,
    addCategory,
    startEditingCategory,
    saveCategoryName,
    removeCategory,
    addScheduledItem,
    updateScheduled,
    removeScheduled,
  };
}
