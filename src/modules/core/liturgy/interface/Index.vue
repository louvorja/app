<template>
  <div
    v-if="module && module.show"
    class="liturgy-page"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- Overlay de drop -->
    <div v-if="isDraggingOver" class="liturgy-drop-overlay">
      <v-icon icon="mdi-plus-circle-outline" size="48" />
      <span>{{ t("data.drop_hint") }}</span>
    </div>

    <!-- Cabeçalho fixo -->
    <header class="liturgy-toolbar">
      <div class="liturgy-toolbar-title">
        <v-icon icon="mdi-view-list-outline" size="20" />
        <span>{{ t("title") }}</span>
        <span v-if="items.length" class="liturgy-toolbar-count">{{ items.length }}</span>
      </div>

      <!-- Seletor de semana -->
      <div class="liturgy-week-picker">
        <button class="lit-btn lit-btn--ghost lit-week-nav" @click="changeWeek(-1)">
          <v-icon icon="mdi-chevron-left" size="16" />
        </button>
        <input
          type="week"
          class="lit-week-input"
          :value="activeWeek"
          :title="t('week.label')"
          @change="onWeekChange"
        />
        <button class="lit-btn lit-btn--ghost lit-week-nav" @click="changeWeek(1)">
          <v-icon icon="mdi-chevron-right" size="16" />
        </button>
      </div>

      <!-- Cronômetro do culto -->
      <LiturgyTimer
        :running="running"
        :timer-seconds="timerSeconds"
        :timer-display="timerDisplay"
        :has-items="!!items.length"
        @toggle="toggleTimer"
        @prev="timerPrev"
        @next="timerNext"
      />

      <v-spacer />

      <!-- Menu de ações em massa -->
      <div class="lit-menu-anchor">
        <button
          class="lit-btn lit-btn--ghost"
          :title="t('actions.mark_all')"
          @click="menuOpen = !menuOpen"
        >
          <v-icon icon="mdi-dots-vertical" size="16" />
        </button>
        <div v-if="menuOpen" class="lit-dropdown" @mouseleave="menuOpen = false">
          <button class="lit-dropdown-item" @click="markAll(true)">
            <v-icon icon="mdi-check-all" size="14" />
            {{ t("actions.mark_all") }}
          </button>
          <button class="lit-dropdown-item" @click="markAll(false)">
            <v-icon icon="mdi-close-box-multiple-outline" size="14" />
            {{ t("actions.unmark_all") }}
          </button>
          <button class="lit-dropdown-item lit-dropdown-item--danger" @click="removeDone">
            <v-icon icon="mdi-delete-clock-outline" size="14" />
            {{ t("actions.remove_done") }}
          </button>
        </div>
      </div>

      <!-- Toggle anotações -->
      <button
        class="lit-btn lit-btn--ghost"
        :class="{ 'lit-btn--active': showNotes }"
        :title="t('actions.toggle_notes')"
        @click="showNotes = !showNotes"
      >
        <v-icon icon="mdi-note-edit-outline" size="16" />
      </button>

      <!-- Toggle bloqueio -->
      <button
        class="lit-btn lit-btn--ghost"
        :class="{ 'lit-btn--active': locked }"
        :title="t('actions.toggle_lock')"
        @click="toggleLock"
      >
        <v-icon :icon="locked ? 'mdi-lock' : 'mdi-lock-open-outline'" size="16" />
      </button>

      <button
        class="lit-btn lit-btn--ghost"
        :title="t('actions.scheduled_items')"
        @click="openSchedulesDialog"
      >
        <v-icon icon="mdi-calendar-multiselect" size="16" />
        <span class="lit-btn-label">{{ t("actions.scheduled_items_short") }}</span>
      </button>
      <LiturgyImportExport @save="saveFile" @file-load="onFileLoad" />
      <button class="lit-btn lit-btn--ghost" :title="t('actions.clear')" @click="confirmClear">
        <v-icon icon="mdi-delete-sweep-outline" size="16" />
      </button>
      <button class="lit-btn lit-btn--ghost" :title="t('actions.close')" @click="closeModule">
        <v-icon icon="mdi-close" size="16" />
      </button>
    </header>

    <!-- Corpo: lista + painel de anotações -->
    <div class="liturgy-body">
      <!-- Lista de itens -->
      <div class="liturgy-list-area" :class="{ 'liturgy-list-area--locked': locked }">
        <!-- Lista vazia -->
        <div v-if="items.length === 0" class="liturgy-empty">
          <v-icon icon="mdi-view-list-outline" size="80" class="text-disabled" />
          <div class="liturgy-empty-title">{{ t("data.empty") }}</div>
          <div class="liturgy-empty-hint">{{ t("data.empty_hint") }}</div>
          <button v-if="!locked" class="lit-btn lit-btn--primary mt-4" @click="openItemDialog()">
            <v-icon icon="mdi-plus" size="16" />
            <span>{{ t("actions.add") }}</span>
          </button>
        </div>

        <!-- Lista de itens (sbLiturgia) -->
        <draggable
          v-else
          :model-value="items"
          item-key="id"
          :disabled="locked"
          handle=".lit-card-grip"
          class="liturgy-list"
          ghost-class="lit-card--ghost"
          @update:model-value="onReorder"
        >
          <template #item="{ element, index }">
            <LiturgyItem
              :element="element"
              :index="index"
              :locked="locked"
              :timer-active="running && timerCurrentIndex === index"
              :timer-progress="timerItemProgress"
              :default-color="defaultColor"
              :is-checked="isChecked"
              :icon-for="iconForItem"
              :subtitle-for="subtitleFor"
              @edit="openItemDialog"
              @remove="confirmRemove"
              @execute="executeItem"
              @play-music="playMusic"
              @change-color="changeColor"
              @toggle-checked="toggleChecked"
            />
          </template>
        </draggable>
      </div>

      <!-- Painel de anotações por dia -->
      <aside v-if="showNotes" class="liturgy-notes-panel">
        <div class="lit-notes-header">
          <v-icon icon="mdi-note-edit-outline" size="16" />
          <span>{{ t("notes.title") }}</span>
        </div>
        <div class="lit-notes-tabs">
          <button
            v-for="(day, i) in noteDays"
            :key="i"
            class="lit-notes-tab"
            :class="{ 'is-active': noteDayIndex === i }"
            @click="noteDayIndex = i"
          >
            {{ day }}
          </button>
        </div>
        <textarea
          class="lit-notes-area"
          :placeholder="t('notes.placeholder')"
          :value="currentNote"
          @input="onNoteInput"
        />
      </aside>
    </div>

    <!-- Rodapé fixo -->
    <footer v-if="!locked" class="liturgy-footer">
      <span class="liturgy-footer-info">
        <v-icon icon="mdi-clock-outline" size="14" />
        {{ t("data.total") }}: {{ totalDuration }}min
      </span>
      <v-spacer />
      <button class="lit-btn lit-btn--ghost" @click="quickAdd('categoria')">
        <v-icon icon="mdi-format-section" size="14" />
        <span>{{ t("types.categoria") }}</span>
      </button>
      <button class="lit-btn lit-btn--ghost" @click="quickAdd('anotacao')">
        <v-icon icon="mdi-note-text-outline" size="14" />
        <span>{{ t("types.anotacao") }}</span>
      </button>
      <button class="lit-btn lit-btn--primary" @click="openItemDialog()">
        <v-icon icon="mdi-plus" size="16" />
        <span>{{ t("actions.add") }}</span>
      </button>
    </footer>

    <!-- ============================================================== -->
    <!-- DIALOG: Adicionar/Editar Item -->
    <!-- ============================================================== -->
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

    <!-- ============================================================== -->
    <!-- DIALOG: Itens Agendados -->
    <!-- ============================================================== -->
    <v-dialog v-model="schedulesDialog" max-width="780" persistent>
      <v-card class="lit-dialog">
        <div class="lit-dialog-title">
          <v-icon icon="mdi-calendar-multiselect" size="18" />
          <span>{{ t("schedules.title") }}</span>
          <v-spacer />
          <button class="lit-card-action" @click="schedulesDialog = false">
            <v-icon icon="mdi-close" size="14" />
          </button>
        </div>

        <div class="lit-schedules">
          <aside class="lit-schedules-left">
            <div class="lit-schedules-head">
              <span>{{ t("schedules.categories") }}</span>
              <button
                class="lit-card-action"
                :title="t('schedules.add_category')"
                @click="addCategory"
              >
                <v-icon icon="mdi-plus" size="14" />
              </button>
            </div>
            <ul class="lit-schedules-cats">
              <li v-if="scheduledCategories.length === 0" class="lit-hint pa-2">
                {{ t("schedules.no_categories") }}
              </li>
              <li
                v-for="c in scheduledCategories"
                :key="c.id"
                :class="['lit-schedules-cat', { 'is-active': activeCatId === c.id }]"
                @click="activeCatId = c.id"
              >
                <input
                  v-if="editingCatId === c.id"
                  v-model="editingCatName"
                  class="lit-input"
                  @blur="saveCategoryName(c.id)"
                  @keyup.enter="saveCategoryName(c.id)"
                  @keyup.esc="editingCatId = null"
                />
                <span v-else @dblclick="startEditingCategory(c)">{{ c.nome }}</span>
                <v-spacer />
                <button
                  class="lit-card-action"
                  :title="t('actions.edit')"
                  @click.stop="startEditingCategory(c)"
                >
                  <v-icon icon="mdi-pencil" size="12" />
                </button>
                <button
                  class="lit-card-action"
                  :title="t('actions.remove')"
                  @click.stop="removeCategory(c.id)"
                >
                  <v-icon icon="mdi-close" size="12" />
                </button>
              </li>
            </ul>
          </aside>

          <section class="lit-schedules-right">
            <div class="lit-schedules-head">
              <span v-if="activeCategory">{{ activeCategory.nome }}</span>
              <span v-else>{{ t("schedules.select_category") }}</span>
              <v-spacer />
              <button
                v-if="activeCategory"
                class="lit-btn lit-btn--primary"
                @click="addScheduledItem"
              >
                <v-icon icon="mdi-plus" size="14" />
                <span>{{ t("schedules.add_item") }}</span>
              </button>
            </div>

            <div v-if="!activeCategory" class="lit-empty">
              {{ t("schedules.select_category_hint") }}
            </div>

            <div v-else class="lit-schedules-table">
              <div class="lit-schedules-row lit-schedules-row--head">
                <div class="col-date">{{ t("schedules.date") }}</div>
                <div class="col-name">{{ t("schedules.item_name") }}</div>
                <div class="col-file">{{ t("schedules.file") }}</div>
                <div class="col-actions"></div>
              </div>
              <div v-if="categoryItems.length === 0" class="lit-empty">
                {{ t("schedules.no_items") }}
              </div>
              <div v-for="it in categoryItems" :key="it.id" class="lit-schedules-row">
                <div class="col-date">
                  <input
                    v-model="it.data"
                    type="date"
                    class="lit-input"
                    @change="updateScheduled(it)"
                  />
                </div>
                <div class="col-name">
                  <input
                    v-model="it.nome"
                    type="text"
                    class="lit-input"
                    @change="updateScheduled(it)"
                  />
                </div>
                <div class="col-file">
                  <input
                    v-model="it.arquivo"
                    type="text"
                    class="lit-input"
                    @change="updateScheduled(it)"
                  />
                </div>
                <div class="col-actions">
                  <button
                    class="lit-card-action"
                    :title="t('actions.remove')"
                    @click="removeScheduled(it.id)"
                  >
                    <v-icon icon="mdi-close" size="12" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="lit-dialog-footer">
          <v-spacer />
          <button class="lit-btn lit-btn--primary" @click="schedulesDialog = false">
            {{ t("actions.close") }}
          </button>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useLiturgyPersistence } from "../composables/useLiturgyPersistence";
import { useLiturgyItems, COLORS, DEFAULT_COLOR } from "../composables/useLiturgyItems";
import { useLiturgyTimer } from "../composables/useLiturgyTimer";
import LiturgyTimer from "./LiturgyTimer.vue";
import LiturgyItem from "./LiturgyItem.vue";
import LiturgyItemForm from "./LiturgyItemForm.vue";
import LiturgyImportExport from "./LiturgyImportExport.vue";

const TRANSLATIONS = { pt, es };

export default {
  name: "LiturgyModule",
  components: { draggable, LiturgyTimer, LiturgyItem, LiturgyItemForm, LiturgyImportExport },
  setup() {
    const persist = useLiturgyPersistence();
    const litItems = useLiturgyItems(persist.activeWeek, persist.scheduledCategories);
    const timer = useLiturgyTimer(litItems.items, litItems.totalDuration);

    return {
      // ── persistence ──
      activeWeek: persist.activeWeek,
      locked: persist.locked,
      showNotes: persist.showNotes,
      noteDayIndex: persist.noteDayIndex,
      schedulesDialog: persist.schedulesDialog,
      activeCatId: persist.activeCatId,
      editingCatId: persist.editingCatId,
      editingCatName: persist.editingCatName,
      scheduledCategories: persist.scheduledCategories,
      activeCategory: persist.activeCategory,
      categoryItems: persist.categoryItems,
      noteDays: persist.noteDays,
      currentNote: persist.currentNote,
      onWeekChange: persist.onWeekChange,
      changeWeek: persist.changeWeek,
      toggleLock: persist.toggleLock,
      onNoteInput: persist.onNoteInput,
      openSchedulesDialog: persist.openSchedulesDialog,
      addCategory: persist.addCategory,
      startEditingCategory: persist.startEditingCategory,
      saveCategoryName: persist.saveCategoryName,
      removeCategory: persist.removeCategory,
      addScheduledItem: persist.addScheduledItem,
      updateScheduled: persist.updateScheduled,
      removeScheduled: persist.removeScheduled,
      saveFile: persist.saveFile,
      onFileLoad: persist.onFileLoad,

      // ── items ──
      items: litItems.items,
      totalDuration: litItems.totalDuration,
      dialog: litItems.dialog,
      editIndex: litItems.editIndex,
      form: litItems.form,
      colors: COLORS,
      defaultColor: DEFAULT_COLOR,
      musicsList: litItems.musicsList,
      isDraggingOver: litItems.isDraggingOver,
      menuOpen: litItems.menuOpen,
      isChecked: litItems.isChecked,
      toggleChecked: litItems.toggleChecked,
      onReorder: litItems.onReorder,
      iconForItem: litItems.iconForItem,
      subtitleFor: litItems.subtitleFor,
      changeColor: litItems.changeColor,
      markAll: litItems.markAll,
      removeDone: litItems.removeDone,
      openItemDialog: litItems.openItemDialog,
      quickAdd: litItems.quickAdd,
      onTypeChange: litItems.onTypeChange,
      setMusicChoice: litItems.setMusicChoice,
      onMusicChange: litItems.onMusicChange,
      onScheduledCategoryChange: litItems.onScheduledCategoryChange,
      saveItem: litItems.saveItem,
      confirmRemove: litItems.confirmRemove,
      confirmClear: () => litItems.confirmClear(timer.stopTimer),
      executeItem: litItems.executeItem,
      playMusic: litItems.playMusic,
      openSite: litItems.openSite,
      chooseFolder: litItems.chooseFolder,
      chooseFile: litItems.chooseFile,
      setFormField: litItems.setFormField,
      onDragOver: litItems.onDragOver,
      onDrop: litItems.onDrop,

      // ── timer ──
      running: timer.running,
      timerSeconds: timer.timerSeconds,
      timerCurrentIndex: timer.timerCurrentIndex,
      timerItemProgress: timer.timerItemProgress,
      timerDisplay: timer.timerDisplay,
      toggleTimer: timer.toggleTimer,
      timerNext: timer.timerNext,
      timerPrev: timer.timerPrev,

      // refs privados para lifecycle hooks
      _litItems: litItems,
      _persist: persist,
      _timer: timer,
    };
  },
  computed: {
    module() {
      return this.$modules.get("liturgy");
    },
  },
  async mounted() {
    await this._litItems.loadMusicsList();
    this._broadcastUnlisten = this.$broadcast.listen((data) => {
      if (data?.type === BROADCAST_TYPE.LITURGY_NEW_ANNOTATION) {
        this.$modules.open("liturgy");
        this.$nextTick(() => {
          this._litItems.openItemDialog();
          this._litItems.form.value.tipo = "anotacao";
        });
      }
    });
  },
  beforeUnmount() {
    this._timer.stopTimer();
    if (typeof this._broadcastUnlisten === "function") {
      this._broadcastUnlisten();
    }
  },
  methods: {
    t(key) {
      const lang = this.$i18n?.locale || "pt";
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.pt;
      const path = key.split(".");
      let cur = dict;
      for (const k of path) {
        if (cur && typeof cur === "object" && k in cur) cur = cur[k];
        else return key;
      }
      return typeof cur === "string" ? cur : key;
    },
    closeModule() {
      this._timer.stopTimer();
      this.$modules.close("liturgy");
    },
    onDragLeave(e) {
      if (!this.$el.contains(e.relatedTarget)) {
        this._litItems.isDraggingOver.value = false;
      }
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

/* ====================== Overlay de drag-drop ====================== */
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

/* ====================== Header (toolbar) ====================== */
.liturgy-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.04));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
  min-height: 38px;
  flex-wrap: wrap;
}
.liturgy-toolbar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
}
.liturgy-toolbar-count {
  background: rgba(var(--lj-on-surface-ch), 0.1);
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
}

/* Seletor de semana */
.liturgy-week-picker {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 4px;
}
.lit-week-input {
  height: 26px;
  padding: 0 6px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}
.lit-week-input:focus {
  border-color: var(--lj-navy);
}
.lit-btn.lit-week-nav {
  padding: 0 4px;
  min-width: 24px;
}

/* Botão ativo (notas, lock) */
.lit-btn.lit-btn--active {
  background: rgba(var(--lj-navy-ch), 0.15);
  color: var(--lj-navy);
  border-color: rgba(var(--lj-navy-ch), 0.4);
}

/* Esconde label em toolbars comprimidas */
.lit-btn-label {
  display: none;
}
@media (min-width: 700px) {
  .lit-btn-label {
    display: inline;
  }
}

/* ====================== Corpo (lista + notas) ====================== */
.liturgy-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.liturgy-list-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* ====================== Lista de itens ====================== */
.liturgy-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ====================== Empty state ====================== */
.liturgy-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}
.liturgy-empty-title {
  font-size: 18px;
  font-weight: 500;
  margin-top: 12px;
}
.liturgy-empty-hint {
  font-size: 13px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  margin-top: 4px;
}

/* ====================== Footer ====================== */
.liturgy-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(var(--lj-on-surface-ch), 0.03);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
  min-height: 38px;
}
.liturgy-footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}

/* ====================== Anotações por dia ====================== */
.liturgy-notes-panel {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(var(--v-border-color), 0.3);
  background: rgba(var(--lj-on-surface-ch), 0.02);
}
.lit-notes-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.04);
}
.lit-notes-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 6px 2px;
}
.lit-notes-tab {
  padding: 2px 7px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 3px;
  background: transparent;
  font-size: 11px;
  cursor: pointer;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}
.lit-notes-tab:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
}
.lit-notes-tab.is-active {
  background: var(--lj-navy);
  color: var(--lj-white);
  border-color: var(--lj-navy);
}
.lit-notes-area {
  flex: 1;
  margin: 6px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 12px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
}
.lit-notes-area:focus {
  border-color: var(--lj-navy);
}

/* ====================== Buttons ====================== */
.lit-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(var(--lj-on-surface-ch), 0.06);
  color: var(--lj-text);
  transition:
    background 0.15s,
    border 0.15s;
  white-space: nowrap;
}
.lit-btn:hover {
  background: rgba(var(--lj-on-surface-ch), 0.12);
}
.lit-btn--ghost {
  background: transparent;
  border: 1px solid transparent;
}
.lit-btn--ghost:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
  border-color: rgba(var(--v-border-color), 0.4);
}
.lit-btn--primary {
  background: var(--lj-navy);
  color: var(--lj-white);
}
.lit-btn--primary:hover {
  filter: brightness(1.1);
}
.lit-btn--danger {
  background: #dc2626;
  color: white;
}
.lit-btn--danger:hover {
  background: #b91c1c;
}

/* ====================== Dropdown menu ====================== */
.lit-menu-anchor {
  position: relative;
}
.lit-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 200;
  background: var(--lj-surface-bg);
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  min-width: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.lit-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--lj-text);
  text-align: left;
}
.lit-dropdown-item:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
}
.lit-dropdown-item--danger {
  color: #dc2626;
}
.lit-dropdown-item--danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* ─── Shared input styles (used in schedules dialog below) ─── */
.lit-input {
  height: 30px;
  padding: 0 8px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 13px;
  font-family: inherit;
  width: 100%;
  outline: none;
}
.lit-input:focus {
  border-color: var(--lj-navy);
  box-shadow: 0 0 0 2px rgba(var(--lj-navy-ch), 0.15);
}
.lit-hint {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  padding: 4px 0;
}

/* ====================== Dialog: Itens Agendados ====================== */
/* (LiturgyItemForm dialog CSS lives in LiturgyItemForm.vue) */
.lit-schedules {
  display: flex;
  min-height: 400px;
  max-height: 60vh;
}
.lit-schedules-left {
  width: 240px;
  border-right: 1px solid rgba(var(--v-border-color), 0.3);
  display: flex;
  flex-direction: column;
}
.lit-schedules-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lit-schedules-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(var(--lj-on-surface-ch), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  font-weight: 500;
  font-size: 12px;
}
.lit-schedules-cats {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}
.lit-schedules-cat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  font-size: 12px;
}
.lit-schedules-cat:hover {
  background: rgba(var(--lj-on-surface-ch), 0.04);
}
.lit-schedules-cat.is-active {
  background: rgba(var(--lj-navy-ch), 0.1);
  color: var(--lj-navy);
  font-weight: 500;
}
.lit-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--lj-on-surface-ch), 0.5);
  font-size: 12px;
  padding: 20px;
  text-align: center;
}
.lit-schedules-table {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.lit-schedules-row {
  display: grid;
  grid-template-columns: 130px 1fr 1fr 30px;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
  align-items: center;
}
.lit-schedules-row--head {
  background: rgba(var(--lj-on-surface-ch), 0.04);
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(var(--lj-on-surface-ch), 0.7);
}
.lit-schedules-row .lit-input {
  height: 26px;
  font-size: 12px;
}

.mt-4 {
  margin-top: 16px;
}
.pa-2 {
  padding: 8px;
}
</style>
