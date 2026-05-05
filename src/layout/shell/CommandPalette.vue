<template>
  <v-dialog
    v-model="open"
    max-width="640"
    transition="dialog-top-transition"
    :scrim="true"
    @keydown.escape.stop="close"
  >
    <v-card class="cmd-palette" rounded="lg" elevation="8">
      <!-- Input de busca -->
      <div class="cmd-search">
        <v-icon icon="mdi-magnify" size="22" class="mr-2 text-medium-emphasis" />
        <input
          ref="searchInput"
          v-model="query"
          :aria-label="$t('shell.search_placeholder')"
          :placeholder="$t('shell.search_placeholder')"
          class="cmd-input"
          autocomplete="off"
          spellcheck="false"
          @keydown.down.prevent="moveDown"
          @keydown.up.prevent="moveUp"
          @keydown.enter.prevent="executeSelected"
          @keydown.escape.prevent="close"
        />
        <kbd v-if="!query" class="cmd-kbd cmd-kbd--hint">Esc</kbd>
        <v-btn
          v-else
          icon="mdi-close"
          size="x-small"
          variant="text"
          density="compact"
          :aria-label="$t('alert.close')"
          @click="query = ''"
        />
      </div>

      <v-divider />

      <!-- Lista de resultados -->
      <div ref="resultsContainer" class="cmd-results">
        <div
          v-if="!loading && results.length === 0"
          class="cmd-empty pa-6 text-center text-medium-emphasis"
        >
          <v-icon icon="mdi-magnify" size="36" class="mb-2 text-disabled" />
          <div>{{ $t("shell.no_results") }}</div>
        </div>

        <div v-if="loading" class="cmd-loading pa-4 text-center">
          <v-progress-circular indeterminate size="24" />
        </div>

        <template v-for="(group, gkey) in groupedResults" :key="gkey">
          <div class="cmd-group-label">{{ groupLabel(gkey) }}</div>
          <button
            v-for="item in group"
            :key="item.id"
            class="cmd-item"
            :class="{ 'cmd-item--active': isSelected(item) }"
            @click="execute(item)"
            @mouseenter="setActive(item)"
          >
            <v-icon :icon="item.icon" size="18" class="cmd-item-icon" />
            <div class="cmd-item-body">
              <div class="cmd-item-title lj-u-truncate">
                <template v-for="(part, i) in highlightParts(item.title)" :key="i">
                  <mark v-if="part.mark">{{ part.text }}</mark>
                  <span v-else>{{ part.text }}</span>
                </template>
              </div>
              <div v-if="item.subtitle" class="cmd-item-subtitle">{{ item.subtitle }}</div>
            </div>
            <kbd v-if="item.shortcut" class="cmd-kbd">{{ item.shortcut }}</kbd>
          </button>
        </template>

        <button v-if="hasMore" class="cmd-load-more" @click="loadMore">
          {{ $t("shell.load_more") }}
        </button>
      </div>

      <!-- Footer com hints -->
      <v-divider />
      <div class="cmd-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          {{ $t("shell.navigate") }}
        </span>
        <span>
          <kbd>Enter</kbd>
          {{ $t("shell.execute") }}
        </span>
        <span>
          <kbd>Esc</kbd>
          {{ $t("shell.close") }}
        </span>
        <v-spacer />
        <span class="text-caption text-disabled">
          {{ results.length }}{{ hasMore ? "+" : "" }} {{ $t("shell.results") }}
        </span>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import CommandRegistry from "@/helpers/CommandRegistry";
import Database from "@/helpers/Database";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";

const PAGE_SIZE = 50;

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();
const theme = useTheme();

const searchInput = ref(null);
const resultsContainer = ref(null);
const query = ref("");
const selectedIndex = ref(0);
const allCommands = ref([]);
const loading = ref(false);
const visibleCount = ref(PAGE_SIZE);

// Incrementado a cada chamada de loadCommands para descartar cargas obsoletas
let _loadId = 0;

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

/** Resultados brutos: aplica Fuse ou filtro por categoria */
const _rawResults = computed(() => {
  if (!allCommands.value.length) return [];

  if (!query.value.trim()) {
    const recents = allCommands.value.filter((c) => c.category === "recent").slice(0, 5);
    const favs = allCommands.value.filter((c) => c.category === "favorite").slice(0, 5);
    const actions = allCommands.value.filter((c) => c.category === "action").slice(0, 8);
    const modules = allCommands.value.filter((c) => c.category === "module");
    return [...recents, ...favs, ...actions, ...modules];
  }

  // Número exato: prioriza hit direto por id
  const numMatch = query.value.trim().match(/^\d+$/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    const exactHits = allCommands.value.filter(
      (c) => c.category === "music" && c.id === `music:${num}`
    );
    if (exactHits.length > 0) {
      const { results: fuseHits } = CommandRegistry.search(query.value, { limit: 500 });
      const filtered = fuseHits.filter((i) => !exactHits.includes(i));
      return [...exactHits, ...filtered];
    }
  }

  const { results: r } = CommandRegistry.search(query.value, { limit: 500 });
  return r;
});

const hasMore = computed(() => _rawResults.value.length > visibleCount.value);
const results = computed(() => _rawResults.value.slice(0, visibleCount.value));

const groupedResults = computed(() => {
  const ORDER = ["recent", "favorite", "action", "module", "music", "hymn", "bible"];
  const groups = {};
  results.value.forEach((item) => {
    const cat = item.category || "action";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });
  const sorted = {};
  ORDER.forEach((k) => {
    if (groups[k]) sorted[k] = groups[k];
  });
  Object.keys(groups).forEach((k) => {
    if (!sorted[k]) sorted[k] = groups[k];
  });
  return sorted;
});

const activeItem = computed(() => results.value[selectedIndex.value] || null);

watch(open, (v) => {
  if (v) {
    query.value = "";
    selectedIndex.value = 0;
    visibleCount.value = PAGE_SIZE;
    loadCommands();
    nextTick(() => searchInput.value?.focus());
  }
});

watch(query, () => {
  selectedIndex.value = 0;
  visibleCount.value = PAGE_SIZE;
});

watch(selectedIndex, () => {
  nextTick(() => scrollIntoView());
});

async function loadCommands() {
  // Lazy: pula se os comandos já estão em memória
  if (CommandRegistry.isLoaded()) {
    if (!allCommands.value.length) {
      const tFn = (key) => {
        try {
          return t(key);
        } catch {
          return key;
        }
      };
      allCommands.value = await CommandRegistry.getAll(Database, UserData, tFn);
      _patchThemeCmd();
    }
    return;
  }

  if (loading.value) return;
  loading.value = true;
  const myLoadId = ++_loadId;

  try {
    const tFn = (key) => {
      try {
        return t(key);
      } catch {
        return key;
      }
    };

    const commands = await CommandRegistry.getAll(Database, UserData, tFn);

    // Descarta resultado se outra carga foi iniciada enquanto aguardávamos
    if (myLoadId !== _loadId) return;

    allCommands.value = commands;
    _patchThemeCmd();
  } catch (e) {
    console.error("[CommandPalette] Falha ao carregar:", e);
  } finally {
    if (myLoadId === _loadId) loading.value = false;
  }
}

function _patchThemeCmd() {
  const themeCmd = allCommands.value.find((c) => c.id === "theme:toggle");
  if (themeCmd) {
    themeCmd.run = () => {
      const current = theme.global.name.value;
      theme.global.name.value = current === "dark" ? "light" : "dark";
      UserData.set("theme", theme.global.name.value);
      AppData.set("is_dark", theme.global.current.value.dark);
    };
  }
}

function loadMore() {
  visibleCount.value += PAGE_SIZE;
}

function isSelected(item) {
  return activeItem.value === item;
}

function setActive(item) {
  const idx = results.value.indexOf(item);
  if (idx >= 0) selectedIndex.value = idx;
}

function moveDown() {
  selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1);
}

function moveUp() {
  selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
}

function executeSelected() {
  if (activeItem.value) execute(activeItem.value);
}

function execute(item) {
  try {
    item.run();
  } catch (e) {
    console.error("[CommandPalette] Erro ao executar comando:", item.id, e);
  }
  close();
}

function close() {
  open.value = false;
}

function scrollIntoView() {
  const items = resultsContainer.value?.querySelectorAll(".cmd-item");
  if (items && items[selectedIndex.value]) {
    items[selectedIndex.value].scrollIntoView({ block: "nearest" });
  }
}

function groupLabel(cat) {
  const key = `shell.cat.${cat}`;
  try {
    const label = t(key);
    return label !== key ? label : cat;
  } catch {
    return cat;
  }
}

function highlightParts(text) {
  const str = String(text || "");
  if (!query.value) return [{ text: str, mark: false }];
  const q = query.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${q})`, "gi");
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: str.slice(lastIndex, match.index), mark: false });
    }
    parts.push({ text: match[1], mark: true });
    lastIndex = match.index + match[1].length;
  }
  if (lastIndex < str.length) {
    parts.push({ text: str.slice(lastIndex), mark: false });
  }
  return parts.length ? parts : [{ text: str, mark: false }];
}
</script>

<style scoped>
.cmd-palette.cmd-palette {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  background: var(--lj-popup-bg);
  font-family: var(--lj-font-shell);
}

.cmd-search {
  display: flex;
  align-items: center;
  padding: var(--lj-space-5) var(--lj-space-6);
  border-bottom: 1px solid var(--lj-surface-divider);
}

.cmd-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--lj-text-xl);
  background: transparent;
  color: var(--lj-text);
  font-family: inherit;
}

.cmd-input::placeholder {
  color: var(--lj-text-muted);
}

.cmd-results {
  flex: 1;
  overflow-y: auto;
  max-height: 50vh;
  padding: var(--lj-space-2) 0;
}

.cmd-loading {
  display: flex;
  justify-content: center;
  padding: var(--lj-space-6);
}

.cmd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--lj-text-muted);
}

.cmd-group-label {
  padding: var(--lj-space-4) var(--lj-space-6) var(--lj-space-1);
  font-size: var(--lj-text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--lj-text-subtle);
  font-weight: var(--lj-weight-semibold);
}

.cmd-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--lj-space-3) var(--lj-space-6);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--lj-text);
  gap: var(--lj-space-4);
  font-size: var(--lj-text-lg);
  font-family: inherit;
  transition: background var(--lj-transition-fast);
}

.cmd-item:hover,
.cmd-item--active {
  background: var(--lj-active-bg);
}

.cmd-item-icon {
  opacity: 0.7;
  flex-shrink: 0;
  color: var(--lj-text-muted);
}

.cmd-item--active .cmd-item-icon {
  opacity: 1;
  color: var(--lj-navy);
}

.cmd-item-body {
  flex: 1;
  min-width: 0;
}

.cmd-item-title {
  color: var(--lj-text);
}

.cmd-item-title :deep(mark) {
  background: var(--lj-orange-alpha-30);
  color: inherit;
  padding: 0 2px;
  border-radius: var(--lj-radius-xs);
  font-weight: var(--lj-weight-semibold);
}

.cmd-item-subtitle {
  font-size: var(--lj-text-sm);
  color: var(--lj-text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd-kbd {
  font-size: var(--lj-text-sm);
  background: var(--lj-surface-bg-soft);
  border: 1px solid var(--lj-surface-border);
  padding: 2px var(--lj-space-3);
  border-radius: var(--lj-radius-xs);
  font-family: var(--lj-font-mono);
  color: var(--lj-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.cmd-kbd--hint {
  opacity: 0.6;
}

.cmd-load-more {
  display: block;
  width: 100%;
  padding: var(--lj-space-3) var(--lj-space-6);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
  font-size: var(--lj-text-sm);
  color: var(--lj-text-muted);
  font-family: inherit;
  transition: background var(--lj-transition-fast);
}

.cmd-load-more:hover {
  background: var(--lj-active-bg);
  color: var(--lj-text);
}

.cmd-footer {
  display: flex;
  align-items: center;
  padding: var(--lj-space-3) var(--lj-space-6);
  font-size: var(--lj-text-sm);
  gap: var(--lj-space-5);
  color: var(--lj-text-muted);
  flex-wrap: wrap;
  border-top: 1px solid var(--lj-surface-divider);
  background: var(--lj-surface-bg-soft);
}

.cmd-footer kbd {
  font-size: var(--lj-text-xs);
  background: var(--lj-surface-bg);
  border: 1px solid var(--lj-surface-border);
  padding: 1px var(--lj-space-2);
  border-radius: var(--lj-radius-xs);
  font-family: var(--lj-font-mono);
  margin: 0 2px;
  color: var(--lj-text);
}
</style>
