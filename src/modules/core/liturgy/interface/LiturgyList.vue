<template>
  <div class="liturgy-body">
    <!-- Lista de itens -->
    <div class="liturgy-list-area" :class="{ 'liturgy-list-area--locked': locked }">
      <div v-if="items.length === 0" class="liturgy-empty">
        <v-icon icon="mdi-view-list-outline" size="80" class="text-disabled" />
        <div class="liturgy-empty-title">{{ t("data.empty") }}</div>
        <div class="liturgy-empty-hint">{{ t("data.empty_hint") }}</div>
        <button v-if="!locked" class="lit-btn lit-btn--primary mt-4" @click="openItemDialog()">
          <v-icon icon="mdi-plus" size="16" />
          <span>{{ t("actions.add") }}</span>
        </button>
      </div>

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
          @click="setNoteDayIndex(i)"
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
</template>

<script>
import draggable from "vuedraggable";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import LiturgyItem from "./LiturgyItem.vue";

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

export default {
  name: "LiturgyList",
  components: { draggable, LiturgyItem },
  props: {
    items: { type: Array, required: true },
    locked: { type: Boolean, default: false },
    running: { type: Boolean, default: false },
    timerCurrentIndex: { type: Number, default: -1 },
    timerItemProgress: { type: Number, default: 0 },
    defaultColor: { type: String, default: "#00004F" },
    showNotes: { type: Boolean, default: false },
    noteDayIndex: { type: Number, default: 0 },
    noteDays: { type: Array, default: () => [] },
    currentNote: { type: String, default: "" },
    totalDuration: { type: Number, default: 0 },
    isChecked: { type: Function, required: true },
    iconForItem: { type: Function, required: true },
    subtitleFor: { type: Function, required: true },
    onReorder: { type: Function, required: true },
    openItemDialog: { type: Function, required: true },
    confirmRemove: { type: Function, required: true },
    executeItem: { type: Function, required: true },
    playMusic: { type: Function, required: true },
    changeColor: { type: Function, required: true },
    toggleChecked: { type: Function, required: true },
    quickAdd: { type: Function, required: true },
    onNoteInput: { type: Function, required: true },
    setNoteDayIndex: { type: Function, required: true },
  },
  methods: {
    t(key) {
      return _t(key, this.$i18n?.locale || "pt");
    },
  },
};
</script>

<style scoped>
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
.liturgy-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

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

/* Botões duplicados localmente */
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

.mt-4 {
  margin-top: 16px;
}
</style>
