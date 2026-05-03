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
          {{ results.length }} {{ $t("shell.results") }}
        </span>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import Fuse from "fuse.js";
import CommandRegistry from "@/helpers/CommandRegistry";

const MAX_RESULTS = 50;

export default {
  name: "CommandPalette",

  props: {
    modelValue: { type: Boolean, default: false },
  },

  emits: ["update:modelValue"],

  data: () => ({
    query: "",
    selectedIndex: 0,
    allCommands: [],
    fuse: null,
    loading: false,
  }),

  computed: {
    open: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      },
    },

    results() {
      if (!this.query.trim()) {
        // Sem query: mostrar histórico recente + favoritos primeiro, depois ações + módulos
        const recents = this.allCommands.filter((c) => c.category === "recent").slice(0, 5);
        const favs = this.allCommands.filter((c) => c.category === "favorite").slice(0, 5);
        const actions = this.allCommands.filter((c) => c.category === "action").slice(0, 8);
        const modules = this.allCommands.filter((c) => c.category === "module");
        return [...recents, ...favs, ...actions, ...modules].slice(0, MAX_RESULTS);
      }

      if (!this.fuse) return [];

      // Detectar busca por número: "215" → busca música ID 215 primeiro
      const numMatch = this.query.trim().match(/^\d+$/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        const exactHits = this.allCommands.filter(
          (c) => c.category === "music" && c.id === `music:${num}`
        );
        if (exactHits.length > 0) {
          const fuseHits = this.fuse
            .search(this.query, { limit: MAX_RESULTS - exactHits.length })
            .map((r) => r.item)
            .filter((i) => !exactHits.includes(i));
          return [...exactHits, ...fuseHits];
        }
      }

      return this.fuse.search(this.query, { limit: MAX_RESULTS }).map((r) => r.item);
    },

    groupedResults() {
      // Manter ordem de categorias consistente
      const ORDER = ["recent", "favorite", "action", "module", "music", "hymn", "bible"];
      const groups = {};
      this.results.forEach((item) => {
        const cat = item.category || "action";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      });
      // Reordenar chaves
      const sorted = {};
      ORDER.forEach((k) => {
        if (groups[k]) sorted[k] = groups[k];
      });
      Object.keys(groups).forEach((k) => {
        if (!sorted[k]) sorted[k] = groups[k];
      });
      return sorted;
    },

    activeItem() {
      return this.results[this.selectedIndex] || null;
    },
  },

  watch: {
    open(v) {
      if (v) {
        this.query = "";
        this.selectedIndex = 0;
        this.loadCommands();
        this.$nextTick(() => this.$refs.searchInput?.focus());
      }
    },
    query() {
      this.selectedIndex = 0;
    },
    selectedIndex() {
      this.$nextTick(() => this.scrollIntoView());
    },
  },

  methods: {
    async loadCommands() {
      if (this.loading) return;
      this.loading = true;
      try {
        const tFn = (key) => {
          try {
            return this.$t(key);
          } catch {
            return key;
          }
        };

        // Injetar toggle-theme real com acesso ao $vuetify
        const vuetify = this.$vuetify;
        this.allCommands = await CommandRegistry.getAll(this.$database, this.$userdata, tFn);

        // Patch: substituir run do toggle-theme para usar $vuetify local
        const themeCmd = this.allCommands.find((c) => c.id === "theme:toggle");
        if (themeCmd && vuetify) {
          themeCmd.run = () => {
            const current = vuetify.theme.global.name.value;
            vuetify.theme.global.name.value = current === "dark" ? "light" : "dark";
            this.$userdata.set("theme", vuetify.theme.global.name.value);
            this.$appdata.set("is_dark", vuetify.theme.global.current.value.dark);
          };
        }

        this.fuse = new Fuse(this.allCommands, {
          keys: [
            { name: "title", weight: 2 },
            { name: "keywords", weight: 1 },
            { name: "subtitle", weight: 0.5 },
          ],
          threshold: 0.3,
          ignoreLocation: true,
          minMatchCharLength: 1,
        });
      } catch (e) {
        console.error("[CommandPalette] Falha ao carregar:", e);
      } finally {
        this.loading = false;
      }
    },

    isSelected(item) {
      return this.activeItem === item;
    },

    setActive(item) {
      const idx = this.results.indexOf(item);
      if (idx >= 0) this.selectedIndex = idx;
    },

    moveDown() {
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
    },

    moveUp() {
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    },

    executeSelected() {
      if (this.activeItem) this.execute(this.activeItem);
    },

    execute(item) {
      try {
        item.run();
      } catch (e) {
        console.error("[CommandPalette] Erro ao executar comando:", item.id, e);
      }
      this.close();
    },

    close() {
      this.open = false;
    },

    scrollIntoView() {
      const items = this.$refs.resultsContainer?.querySelectorAll(".cmd-item");
      if (items && items[this.selectedIndex]) {
        items[this.selectedIndex].scrollIntoView({ block: "nearest" });
      }
    },

    groupLabel(cat) {
      const key = `shell.cat.${cat}`;
      try {
        const label = this.$t(key);
        return label !== key ? label : cat;
      } catch {
        return cat;
      }
    },

    highlightParts(text) {
      const str = String(text || "");
      if (!this.query) return [{ text: str, mark: false }];
      const q = this.query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    },
  },
};
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
