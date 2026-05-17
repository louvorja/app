<template>
  <div class="liturgy-list-area" :class="{ 'liturgy-list-area--locked': locked }">
    <div v-if="items.length === 0" class="liturgy-empty">
      <v-icon icon="mdi-script" size="80" class="text-disabled" />
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
    <div v-else class="liturgy-scroll">
      <draggable
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
            :default-color="defaultColor"
            :is-checked="isChecked"
            :icon-for="iconForItem"
            :subtitle-for="subtitleFor"
            @edit="openItemDialog"
            @clone="cloneItem"
            @confirm-remove="confirmRemove"
            @execute="executeItem"
            @play-music="playMusic"
            @open-lyric="openLyric"
            @change-color="changeColor"
            @toggle-checked="toggleChecked"
          />
        </template>
      </draggable>
    </div>
  </div>
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
    defaultColor?: string;
    totalDuration?: number;
    isChecked: (item: LiturgyItemData) => boolean;
    iconForItem: (item: LiturgyItemData) => string;
    subtitleFor: (item: LiturgyItemData) => string;
    onReorder: (items: LiturgyItemData[]) => void;
    openItemDialog: (index?: number) => void;
    cloneItem: (index: number) => void;
    confirmRemove: (index?: number) => void;
    executeItem: (item: LiturgyItemData) => void;
    playMusic: (item: LiturgyItemData, mode: string) => void;
    openLyric: (musica: number) => void;
    changeColor: (index: number) => void;
    toggleChecked: (element: LiturgyItemData) => void;
  }>(),
  {
    locked: false,
    defaultColor: "#00004F",
    totalDuration: 0,
  }
);

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);
</script>

<style scoped>
.liturgy-list-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}
.liturgy-scroll {
  flex: 1;

  min-height: 0;

  overflow-y: auto;
  overflow-x: hidden;
}
.liturgy-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
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
