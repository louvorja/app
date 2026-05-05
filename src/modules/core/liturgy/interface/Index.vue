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

    <LiturgyToolbar
      :item-count="safeItems.length"
      :locked="locked ?? false"
      :running="running ?? false"
      :timer-seconds="timerSeconds ?? 0"
      :timer-display="timerDisplay ?? ''"
      :active-week="activeWeek ?? ''"
      :show-notes="showNotes ?? false"
      :menu-open="menuOpen ?? false"
      :change-week="changeWeek"
      :on-week-change="onWeekChange"
      :toggle-timer="toggleTimer"
      :timer-prev="timerPrev"
      :timer-next="timerNext"
      :toggle-menu-open="toggleMenuOpen"
      :close-menu="closeMenu"
      :mark-all="markAll"
      :remove-done="removeDone"
      :toggle-notes="toggleNotes"
      :toggle-lock="toggleLock"
      :open-schedules-dialog="openSchedulesDialog"
      :save-file="saveFile"
      :on-file-load="onFileLoad"
      :confirm-clear="confirmClearBound"
      :close-module="closeModule"
    />

    <LiturgyList
      :items="safeItems"
      :locked="locked ?? false"
      :running="running ?? false"
      :timer-current-index="timerCurrentIndex ?? -1"
      :timer-item-progress="timerItemProgress ?? 0"
      :default-color="defaultColor"
      :show-notes="showNotes ?? false"
      :note-day-index="noteDayIndex ?? 0"
      :note-days="noteDays ?? []"
      :current-note="currentNote ?? ''"
      :total-duration="totalDuration"
      :is-checked="isChecked"
      :icon-for-item="iconForItem"
      :subtitle-for="subtitleFor"
      :on-reorder="onReorder"
      :open-item-dialog="openItemDialog"
      :confirm-remove="confirmRemove"
      :execute-item="executeItem"
      :play-music="playMusic"
      :change-color="changeColor"
      :toggle-checked="toggleChecked"
      :quick-add="quickAdd"
      :on-note-input="onNoteInput"
      :set-note-day-index="setNoteDayIndex"
    />

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
import { ref, computed, nextTick, onMounted, onBeforeUnmount, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import Modules from "@/helpers/Modules";
import Broadcast from "@/helpers/Broadcast";
import { useLiturgyPersistence } from "../composables/useLiturgyPersistence";
import { useLiturgyItems, COLORS, DEFAULT_COLOR } from "../composables/useLiturgyItems";
import { useLiturgyTimer } from "../composables/useLiturgyTimer";
import LiturgyToolbar from "./LiturgyToolbar.vue";
import LiturgyList from "./LiturgyList.vue";
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
const litItems = useLiturgyItems(persist.activeWeek, persist.scheduledCategories);
const timer = useLiturgyTimer(
  litItems.items as unknown as ComputedRef<LiturgyItemData[]>,
  litItems.totalDuration
);

// useLiturgyPersistence
const {
  activeWeek,
  locked,
  showNotes,
  noteDayIndex,
  schedulesDialog,
  activeCatId,
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
  saveCategoryName,
  removeCategory,
  addScheduledItem,
  updateScheduled,
  removeScheduled,
  saveFile,
  onFileLoad,
} = persist;

// useLiturgyItems
const {
  dialog,
  editIndex,
  form,
  isDraggingOver,
  menuOpen,
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
  removeDone,
  openItemDialog,
  quickAdd,
  onTypeChange,
  setMusicChoice,
  onMusicChange,
  onScheduledCategoryChange,
  saveItem,
  confirmRemove,
  confirmClear,
  executeItem,
  playMusic,
  openSite,
  chooseFolder,
  chooseFile,
  onDragOver,
  onDrop,
  loadMusicsList,
  setFormField,
  toggleMenuOpen,
  closeMenu,
} = litItems;

// useLiturgyTimer
const {
  running,
  timerSeconds,
  timerDisplay,
  timerCurrentIndex,
  timerItemProgress,
  toggleTimer,
  stopTimer,
  timerNext,
  timerPrev,
} = timer;

const colors = COLORS;
const defaultColor = DEFAULT_COLOR;
const confirmClearBound = () => confirmClear(stopTimer);
const safeItems = computed(
  (): LiturgyItemData[] => (items.value as LiturgyItemData[] | null) ?? []
);

let _broadcastUnlisten: (() => void) | null = null;

onMounted(async () => {
  await loadMusicsList();
  _broadcastUnlisten = Broadcast.listen((data) => {
    if (data?.type === BROADCAST_TYPE.LITURGY_NEW_ANNOTATION) {
      Modules.open("liturgy");
      nextTick(() => {
        openItemDialog();
        form.value.tipo = "anotacao";
      });
    }
  });
});

onBeforeUnmount(() => {
  stopTimer();
  if (_broadcastUnlisten) _broadcastUnlisten();
});

function closeModule() {
  stopTimer();
  Modules.close("liturgy");
}

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
