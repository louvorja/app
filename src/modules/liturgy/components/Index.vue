<template>
  <div
    v-if="module_ && module_.show"
    ref="el"
    class="liturgy-page"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeaveCustom"
    @drop.prevent="onDrop"
  >
    <div v-if="isDraggingOver" class="liturgy-drop-overlay">
      <v-icon icon="mdi-plus-circle-outline" size="48" />
      <span>{{ t("data.drop_hint") }}</span>
    </div>

    <LiturgyDayTabs
      :active-day="activeDay"
      :day-labels="dayLabels"
      :today-index="todayIndex"
      :set-active-day="setActiveDay"
    />

    <div class="liturgy-body">
      <LiturgyList
        :items="safeItems"
        :locked="locked ?? false"
        :default-color="defaultColor"
        :total-duration="totalDuration"
        :is-checked="isChecked"
        :icon-for-item="iconForItem"
        :subtitle-for="subtitleFor"
        :on-reorder="onReorder"
        :open-item-dialog="openItemDialog"
        :clone-item="cloneItem"
        :confirm-remove="confirmRemove"
        :execute-item="executeItemMaybeMark"
        :play-music="playMusic"
        :change-color="changeColor"
        :toggle-checked="toggleChecked"
      />

      <LiturgyNotesPanel
        v-if="showNotes"
        :day-label="dayLabels[activeDay]"
        :note-html="currentNote"
        :total-duration="totalDuration"
        :on-input="onNoteInput"
      />
    </div>

    <LiturgyItemForm
      v-model:model-value="dialog"
      :edit-index="editIndex"
      :form="form"
      :colors="colors"
      :musics-list="musicsList"
      :scheduled-categories="scheduledCategories"
      :set-form-field="setFormField"
      :on-type-change="onTypeChange"
      :on-music-change="onMusicChange"
      :on-scheduled-category-change="onScheduledCategoryChange"
      :set-music-choice="setMusicChoice"
      :save-item="saveItem"
      :confirm-remove="confirmRemove"
      :open-site="openSite"
      :choose-folder="chooseFolder"
      :choose-file="chooseFile"
      :open-schedules-dialog="openSchedulesDialog"
    />

    <LiturgySchedules
      v-model="schedulesDialog"
      :scheduled-categories="scheduledCategories"
      :active-cat-id="activeCatId"
      :active-category="activeCategory"
      :category-items="categoryItems"
      :set-active-cat-id="setActiveCatId"
      :add-category="addCategory"
      :save-category-name="saveCategoryName"
      :remove-category="removeCategory"
      :add-scheduled-item="addScheduledItem"
      :update-scheduled="updateScheduled"
      :remove-scheduled="removeScheduled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import Modules from "@/helpers/Modules";
import Broadcast from "@/helpers/Broadcast";
import { useLiturgyPersistence } from "../composables/useLiturgyPersistence";
import { useLiturgyItems, COLORS, DEFAULT_COLOR } from "../composables/useLiturgyItems";
import LiturgyDayTabs from "./LiturgyDayTabs.vue";
import LiturgyList from "./LiturgyList.vue";
import LiturgyNotesPanel from "./LiturgyNotesPanel.vue";
import LiturgyItemForm from "./LiturgyItemForm.vue";
import LiturgySchedules from "./LiturgySchedules.vue";
import type { LiturgyItemData } from "../types";

const TRANSLATIONS: Record<string, Record<string, unknown>> = { pt, es };

function _t(key: string, locale: string): string {
  const dict = TRANSLATIONS[locale] ?? TRANSLATIONS.pt;
  const path = key.split(".");
  let cur: unknown = dict;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in cur) cur = (cur as Record<string, unknown>)[k];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);

const el = ref<HTMLElement | null>(null);
const module_ = computed(() => Modules.get("liturgy") as { show: boolean } | null);

const persist = useLiturgyPersistence();
const litItems = useLiturgyItems(persist.activeDay, persist.scheduledCategories);

const {
  activeDay,
  setActiveDay,
  locked,
  showNotes,
  markOnAccess,
  toggleMarkOnAccess,
  schedulesDialog,
  activeCatId,
  scheduledCategories,
  activeCategory,
  categoryItems,
  currentNote,
  setActiveCatId,
  toggleNotes,
  toggleLock,
  onNoteInput,
  openSchedulesDialog,
  addCategory,
  saveCategoryName,
  removeCategory,
  addScheduledItem,
  updateScheduled,
  removeScheduled,
} = persist;

const {
  dialog,
  editIndex,
  form,
  isDraggingOver,
  items,
  totalDuration,
  musicsList,
  isChecked,
  toggleChecked,
  onReorder,
  iconForItem,
  subtitleFor,
  changeColor,
  markAll,
  invertSelection,
  removeDone,
  openItemDialog,
  onTypeChange,
  setMusicChoice,
  onMusicChange,
  onScheduledCategoryChange,
  saveItem,
  confirmRemove,
  cloneItem,
  executeItem,
  playMusic,
  openSite,
  chooseFolder,
  chooseFile,
  onDragOver,
  onDrop,
  loadMusicsList,
  setFormField,
} = litItems;

const openItemDialogRoot = () => openItemDialog();
const executeItemMaybeMark = (item: LiturgyItemData) => {
  executeItem(item);
  if (markOnAccess.value && item.tipo !== "categoria" && !isChecked(item)) {
    toggleChecked(item);
  }
};

const colors = COLORS;
const defaultColor = DEFAULT_COLOR;
const safeItems = computed(
  (): LiturgyItemData[] => (items.value as LiturgyItemData[] | null) ?? []
);

const dayLabels = computed(() => {
  if (locale.value === "es") {
    return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  }
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
});

const todayIndex = computed(() => new Date().getDay());

let _broadcastUnlisten: (() => void) | null = null;

function handleRibbonAction(action: string) {
  switch (action) {
    case "add":
      openItemDialogRoot();
      break;
    case "check_all":
      markAll(true);
      break;
    case "uncheck_all":
      markAll(false);
      break;
    case "invert":
      invertSelection();
      break;
    case "delete_selected":
      removeDone();
      break;
    case "toggle_mark_on_access":
      toggleMarkOnAccess();
      break;
    case "toggle_show_notes":
      toggleNotes();
      break;
    case "toggle_lock":
      toggleLock();
      break;
  }
}

onMounted(async () => {
  await loadMusicsList();
  _broadcastUnlisten = Broadcast.listen((data) => {
    if (data?.type === BROADCAST_TYPE.LITURGY_NEW_ANNOTATION) {
      Modules.open("liturgy");
      nextTick(() => {
        openItemDialog();
        form.value.tipo = "anotacao";
      });
    } else if (data?.type === BROADCAST_TYPE.LITURGY_RIBBON_ACTION) {
      const action = (data?.payload as { action?: string } | undefined)?.action;
      if (action) handleRibbonAction(action);
    }
  });
});

onBeforeUnmount(() => {
  if (_broadcastUnlisten) _broadcastUnlisten();
});

function onDragLeaveCustom(e: DragEvent) {
  if (!el.value?.contains(e.relatedTarget as Node)) isDraggingOver.value = false;
}
</script>

<style scoped>
.liturgy-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-size: 13px;
}

.liturgy-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.liturgy-drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(var(--lj-navy-ch), 0.15);
  border: 3px dashed var(--lj-navy);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--lj-navy);
  font-size: 16px;
  font-weight: 600;
  pointer-events: none;
}
</style>
