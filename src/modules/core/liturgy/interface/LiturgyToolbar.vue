<template>
  <header class="liturgy-toolbar">
    <div class="liturgy-toolbar-title">
      <v-icon icon="mdi-view-list-outline" size="20" />
      <span>{{ t("title") }}</span>
      <span v-if="itemCount" class="liturgy-toolbar-count">{{ itemCount }}</span>
    </div>

    <div class="liturgy-week-picker">
      <button class="lit-btn lit-btn--ghost lit-week-nav" @click="changeWeek(-1)">
        <v-icon icon="mdi-chevron-left" size="16" />
      </button>
      <input
        type="week"
        class="lit-week-input"
        :value="activeWeek"
        :aria-label="t('week.label')"
        :title="t('week.label')"
        @change="onWeekChange"
      />
      <button class="lit-btn lit-btn--ghost lit-week-nav" @click="changeWeek(1)">
        <v-icon icon="mdi-chevron-right" size="16" />
      </button>
    </div>

    <LiturgyTimer
      :running="running"
      :timer-seconds="timerSeconds"
      :timer-display="timerDisplay"
      :has-items="!!itemCount"
      @toggle="toggleTimer"
      @prev="timerPrev"
      @next="timerNext"
    />

    <v-spacer />

    <div class="lit-menu-anchor">
      <button class="lit-btn lit-btn--ghost" :title="t('actions.mark_all')" @click="toggleMenuOpen">
        <v-icon icon="mdi-dots-vertical" size="16" />
      </button>
      <div v-if="menuOpen" class="lit-dropdown" @mouseleave="closeMenu">
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

    <button
      class="lit-btn lit-btn--ghost"
      :class="{ 'lit-btn--active': showNotes }"
      :title="t('actions.toggle_notes')"
      @click="toggleNotes"
    >
      <v-icon icon="mdi-note-edit-outline" size="16" />
    </button>

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
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import LiturgyTimer from "./LiturgyTimer.vue";
import LiturgyImportExport from "./LiturgyImportExport.vue";

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
    itemCount?: number;
    locked?: boolean;
    running?: boolean;
    timerSeconds?: number;
    timerDisplay?: string;
    activeWeek?: string;
    showNotes?: boolean;
    menuOpen?: boolean;
    changeWeek: (dir: number) => void;
    onWeekChange: (event: Event) => void;
    toggleTimer: () => void;
    timerPrev: () => void;
    timerNext: () => void;
    toggleMenuOpen: () => void;
    closeMenu: () => void;
    markAll: (checked: boolean) => void;
    removeDone: () => void;
    toggleNotes: () => void;
    toggleLock: () => void;
    openSchedulesDialog: () => void;
    saveFile: () => void;
    onFileLoad: (event: Event) => void;
    confirmClear: () => void;
    closeModule: () => void;
  }>(),
  {
    itemCount: 0,
    locked: false,
    running: false,
    timerSeconds: 0,
    timerDisplay: "",
    activeWeek: "",
    showNotes: false,
    menuOpen: false,
  }
);

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);
</script>

<style scoped>
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

.lit-btn--active {
  background: rgba(var(--lj-navy-ch), 0.15) !important;
  color: var(--lj-navy) !important;
  border-color: rgba(var(--lj-navy-ch), 0.4) !important;
}

.lit-btn-label {
  display: none;
}
@media (min-width: 700px) {
  .lit-btn-label {
    display: inline;
  }
}

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
</style>
