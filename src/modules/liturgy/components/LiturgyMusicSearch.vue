<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    @update:model-value="$emit('update:modelValue', $event)"
    @keydown.escape="$emit('update:modelValue', false)"
  >
    <v-card class="lms-card">
      <header class="lms-header">
        <v-icon icon="mdi-magnify" size="18" />
        <span>{{ t("music_search.title") }}</span>
        <v-spacer />
        <button class="lms-close" @click="$emit('update:modelValue', false)">
          <v-icon icon="mdi-close" size="14" />
        </button>
      </header>

      <div class="lms-filter">
        <label for="lms-q">{{ t("music_search.find_label") }}</label>
        <input
          id="lms-q"
          ref="inputEl"
          v-model="query"
          type="text"
          class="lms-input"
          autocomplete="off"
          @keydown.enter.prevent="selectFirstMatch"
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
        />
      </div>

      <div class="lms-table-wrap">
        <table class="lms-table">
          <thead>
            <tr>
              <th class="lms-col-album">{{ t("music_search.col_album") }}</th>
              <th class="lms-col-music">{{ t("music_search.col_music") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredRows.length">
              <td colspan="2" class="lms-empty">
                {{ query ? t("music_search.empty_search") : t("music_search.empty") }}
              </td>
            </tr>
            <tr
              v-for="(row, i) in filteredRows"
              :key="`${row.id}-${i}`"
              :class="{ 'is-active': i === activeIndex }"
              @mouseenter="activeIndex = i"
              @click="selectRow(row)"
              @dblclick="selectRow(row)"
            >
              <td>{{ row.album }}</td>
              <td>{{ row.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="lms-footer">
        <span class="lms-count">{{ filteredRows.length }} / {{ allRows.length }}</span>
        <v-spacer />
        <button class="lms-btn" @click="$emit('update:modelValue', false)">
          {{ t("actions.cancel") }}
        </button>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";
import type { LiturgyMusicItem } from "../types";

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

interface Row {
  id: number | string;
  name: string;
  album: string;
  raw: LiturgyMusicItem;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    musicsList?: LiturgyMusicItem[];
  }>(),
  {
    modelValue: false,
    musicsList: () => [],
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  pick: [music: LiturgyMusicItem];
}>();

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);

const query = ref("");
const activeIndex = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

const allRows = computed<Row[]>(() => {
  const list = props.musicsList ?? [];
  const rows: Row[] = [];
  for (const m of list) {
    const albums = (m as { albums?: Array<{ name?: string }> }).albums;
    if (Array.isArray(albums) && albums.length) {
      for (const a of albums) {
        rows.push({ id: m.id_music, name: m.name, album: a?.name ?? "", raw: m });
      }
    } else {
      rows.push({ id: m.id_music, name: m.name, album: "", raw: m });
    }
  }
  rows.sort((a, b) => {
    const al = a.album.localeCompare(b.album, undefined, { sensitivity: "base" });
    if (al !== 0) return al;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  return rows;
});

const filteredRows = computed<Row[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return allRows.value;
  return allRows.value.filter(
    (r) => r.name.toLowerCase().includes(q) || r.album.toLowerCase().includes(q)
  );
});

watch(filteredRows, () => {
  activeIndex.value = 0;
});

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      query.value = "";
      activeIndex.value = 0;
      nextTick(() => inputEl.value?.focus());
    }
  }
);

function moveSelection(delta: number) {
  const max = filteredRows.value.length - 1;
  if (max < 0) return;
  activeIndex.value = Math.max(0, Math.min(max, activeIndex.value + delta));
}

function selectFirstMatch() {
  const row = filteredRows.value[activeIndex.value];
  if (row) selectRow(row);
}

function selectRow(row: Row) {
  emit("pick", row.raw);
  emit("update:modelValue", false);
}
</script>

<style scoped>
.lms-card {
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.lms-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.1));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-weight: 500;
}
.lms-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 3px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
  cursor: pointer;
}
.lms-close:hover {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.lms-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  background: rgba(var(--lj-on-surface-ch), 0.03);
}
.lms-filter label {
  font-size: 12px;
  color: var(--lj-text);
}
.lms-input {
  height: 30px;
  padding: 0 8px;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.lms-input:focus {
  border-color: var(--lj-navy);
  box-shadow: var(--lj-shadow-focus-navy-sm);
}

.lms-table-wrap {
  max-height: 50vh;
  overflow-y: auto;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
}
.lms-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.lms-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(var(--lj-on-surface-ch), 0.06);
  text-align: left;
  padding: 8px 12px;
  font-weight: 500;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.3);
}
.lms-table tbody td {
  padding: 6px 12px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lms-table tbody tr:hover,
.lms-table tbody tr.is-active {
  background: rgba(var(--lj-navy-ch), 0.1);
}
.lms-col-album {
  width: 38%;
}
.lms-empty {
  text-align: center;
  padding: 24px 12px;
  color: rgba(var(--lj-on-surface-ch), 0.55);
  cursor: default;
}

.lms-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(var(--lj-on-surface-ch), 0.02);
}
.lms-count {
  font-size: 11px;
  color: rgba(var(--lj-on-surface-ch), 0.6);
}
.lms-btn {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  background: transparent;
  border: 1px solid rgba(var(--v-border-color), 0.5);
  border-radius: 3px;
  cursor: pointer;
  color: var(--lj-text);
  font-size: 12px;
}
.lms-btn:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
}
</style>
