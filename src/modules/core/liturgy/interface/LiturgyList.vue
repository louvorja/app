<template>
  <div class="liturgy-body">
    <!-- Lista de itens -->
    <div class="liturgy-list-area" :class="{ 'liturgy-list-area--locked': locked }">
      <div v-if="items.length === 0" class="liturgy-empty">
        <v-icon icon="mdi-view-list-outline" size="80" class="text-disabled" />
        <div class="liturgy-empty-title">{{ t("data.empty") }}</div>
        <div class="liturgy-empty-hint">{{ t("data.empty_hint") }}</div>
        <button
          v-if="!locked"
          class="lit-btn lit-btn--primary mt-4"
          data-testid="liturgy-add-item"
          @click="openItemDialog()"
        >
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
    <button
      class="lit-btn lit-btn--primary"
      data-testid="liturgy-add-item"
      @click="openItemDialog()"
    >
      <v-icon icon="mdi-plus" size="16" />
      <span>{{ t("actions.add") }}</span>
    </button>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import LiturgyItem from "./LiturgyItem.vue";
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

withDefaults(
  defineProps<{
    items: LiturgyItemData[];
    locked?: boolean;
    running?: boolean;
    timerCurrentIndex?: number;
    timerItemProgress?: number;
    defaultColor?: string;
    showNotes?: boolean;
    noteDayIndex?: number;
    noteDays?: string[];
    currentNote?: string;
    totalDuration?: number;
    isChecked: (item: LiturgyItemData) => boolean;
    iconForItem: (item: LiturgyItemData) => string;
    subtitleFor: (item: LiturgyItemData) => string;
    onReorder: (items: LiturgyItemData[]) => void;
    openItemDialog: (index?: number) => void;
    confirmRemove: (index: number) => void;
    executeItem: (item: LiturgyItemData) => void;
    playMusic: (item: LiturgyItemData, mode: string) => void;
    changeColor: (index: number) => void;
    toggleChecked: (element: LiturgyItemData) => void;
    quickAdd: (tipo?: string) => void;
    onNoteInput: (event: Event) => void;
    setNoteDayIndex: (index: number) => void;
  }>(),
  {
    locked: false,
    running: false,
    timerCurrentIndex: -1,
    timerItemProgress: 0,
    defaultColor: "#00004F",
    showNotes: false,
    noteDayIndex: 0,
    noteDays: () => [],
    currentNote: "",
    totalDuration: 0,
  }
);

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);
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
