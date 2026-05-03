<template>
  <div
    v-if="module && module.show"
    class="liturgy-page"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div v-if="isDraggingOver" class="liturgy-drop-overlay">
      <v-icon icon="mdi-plus-circle-outline" size="48" />
      <span>{{ t("data.drop_hint") }}</span>
    </div>

    <LiturgyToolbar
      :item-count="items.length"
      :locked="locked"
      :running="running"
      :timer-seconds="timerSeconds"
      :timer-display="timerDisplay"
      :active-week="activeWeek"
      :show-notes="showNotes"
      :menu-open="menuOpen"
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
      :confirm-clear="confirmClear"
      :close-module="closeModule"
    />

    <LiturgyList
      :items="items"
      :locked="locked"
      :running="running"
      :timer-current-index="timerCurrentIndex"
      :timer-item-progress="timerItemProgress"
      :default-color="defaultColor"
      :show-notes="showNotes"
      :note-day-index="noteDayIndex"
      :note-days="noteDays"
      :current-note="currentNote"
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

<script>
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useLiturgyPersistence } from "../composables/useLiturgyPersistence";
import { useLiturgyItems, COLORS, DEFAULT_COLOR } from "../composables/useLiturgyItems";
import { useLiturgyTimer } from "../composables/useLiturgyTimer";
import LiturgyToolbar from "./LiturgyToolbar.vue";
import LiturgyList from "./LiturgyList.vue";
import LiturgyItemForm from "./LiturgyItemForm.vue";
import LiturgySchedules from "./LiturgySchedules.vue";

const TRANSLATIONS = { pt, es };
export default {
  name: "LiturgyModule",
  components: { LiturgyToolbar, LiturgyList, LiturgyItemForm, LiturgySchedules },
  setup() {
    const persist = useLiturgyPersistence();
    const litItems = useLiturgyItems(persist.activeWeek, persist.scheduledCategories);
    const timer = useLiturgyTimer(litItems.items, litItems.totalDuration);
    return {
      ...persist,
      ...litItems,
      ...timer,
      colors: COLORS,
      defaultColor: DEFAULT_COLOR,
      confirmClear: () => litItems.confirmClear(timer.stopTimer),
    };
  },
  computed: {
    module() {
      return this.$modules.get("liturgy");
    },
  },
  async mounted() {
    await this.loadMusicsList();
    this._broadcastUnlisten = this.$broadcast.listen((data) => {
      if (data?.type === BROADCAST_TYPE.LITURGY_NEW_ANNOTATION) {
        this.$modules.open("liturgy");
        this.$nextTick(() => {
          this.openItemDialog();
          this.form.tipo = "anotacao";
        });
      }
    });
  },
  beforeUnmount() {
    this.stopTimer();
    if (typeof this._broadcastUnlisten === "function") this._broadcastUnlisten();
  },
  methods: {
    t(key) {
      const d = TRANSLATIONS[this.$i18n?.locale || "pt"] || TRANSLATIONS.pt;
      return key.split(".").reduce((o, k) => o?.[k], d) ?? key;
    },
    closeModule() {
      this.stopTimer();
      this.$modules.close("liturgy");
    },
    onDragLeave(e) {
      if (!this.$el.contains(e.relatedTarget)) this.isDraggingOver = false;
    },
  },
};
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
