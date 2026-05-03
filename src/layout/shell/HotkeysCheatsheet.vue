<template>
  <v-dialog v-model="dialog" max-width="680" scrollable>
    <v-card class="hk-card" rounded="lg">
      <header class="hk-header">
        <v-icon icon="mdi-keyboard" size="22" class="hk-header-icon" />
        <span class="hk-header-title">{{ $t("hotkeys.title") }}</span>
        <v-spacer />
        <button
          type="button"
          class="hk-close"
          :title="$t('alert.close')"
          :aria-label="$t('alert.close')"
          @click="dialog = false"
        >
          <v-icon icon="mdi-close" size="16" />
        </button>
      </header>

      <div class="hk-body">
        <div v-for="group in groups" :key="group.key" class="hk-group">
          <h3 class="hk-group-title">
            {{ $t("hotkeys.groups." + group.key, group.key) }}
          </h3>

          <div class="hk-list">
            <div v-for="entry in group.entries" :key="entry.combo" class="hk-row">
              <div class="hk-combo">
                <template v-for="(part, i) in entry.comboParts" :key="i">
                  <kbd class="hk-kbd">{{ part }}</kbd>
                  <span v-if="i < entry.comboParts.length - 1" class="hk-plus">+</span>
                </template>
              </div>
              <div class="hk-desc">
                {{ $t(entry.description, entry.description) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="groups.length === 0" class="hk-empty">
          {{ $t("shell.no_results") }}
        </div>
      </div>

      <footer class="hk-footer">
        <span class="hk-tip">
          <v-icon icon="mdi-information-outline" size="13" class="mr-1" />
          {{ $t("hotkeys.tip", "Pressione Esc para fechar") }}
        </span>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import Hotkeys from "@/helpers/Hotkeys";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const GROUP_ORDER = ["general", "navigation", "media", "liturgy", "bible", "system"];

const groups = computed(() => {
  const all = Hotkeys.list();
  const map = {};

  for (const entry of all) {
    const g = entry.group || "general";
    if (!map[g]) map[g] = { key: g, entries: [] };
    map[g].entries.push({
      ...entry,
      comboParts: (entry.label || entry.combo).split("+"),
    });
  }

  // Ordena conforme GROUP_ORDER, depois alfabético
  return Object.values(map).sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a.key);
    const bi = GROUP_ORDER.indexOf(b.key);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.key.localeCompare(b.key);
  });
});
</script>

<style scoped>
.hk-card.hk-card {
  background: var(--lj-popup-bg);
  font-family: var(--lj-font-shell);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.hk-header {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  padding: var(--lj-space-5) var(--lj-space-6);
  border-bottom: 1px solid var(--lj-surface-divider);
  flex-shrink: 0;
}

.hk-header-icon {
  color: var(--lj-navy);
}

.hk-header-title {
  font-size: var(--lj-text-xl);
  font-weight: var(--lj-weight-semibold);
  color: var(--lj-text);
}

.hk-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--lj-radius-sm);
  color: var(--lj-text-muted);
  cursor: pointer;
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast);
  font-family: inherit;
}

.hk-close:hover {
  background: var(--lj-danger);
  color: var(--lj-white);
}

.hk-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--lj-space-5) var(--lj-space-6);
}

.hk-group {
  margin-bottom: var(--lj-space-7);
}

.hk-group:last-child {
  margin-bottom: 0;
}

.hk-group-title {
  font-size: var(--lj-text-xs);
  font-weight: var(--lj-weight-semibold);
  color: var(--lj-orange);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 var(--lj-space-3);
  padding-bottom: var(--lj-space-2);
  border-bottom: 1px solid var(--lj-surface-divider);
}

.hk-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hk-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: var(--lj-space-5);
  padding: var(--lj-space-2) 0;
}

.hk-combo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

.hk-kbd {
  display: inline-flex;
  align-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 var(--lj-space-2);
  font-size: var(--lj-text-xs);
  font-family: var(--lj-font-mono);
  font-weight: var(--lj-weight-medium);
  border: 1px solid var(--lj-kbd-border);
  border-bottom-width: 2px;
  border-radius: var(--lj-radius-sm);
  background: var(--lj-kbd-bg);
  color: var(--lj-text);
  letter-spacing: 0.02em;
  justify-content: center;
}

.hk-plus {
  font-size: var(--lj-text-xs);
  color: var(--lj-text-subtle);
  margin: 0 2px;
  font-weight: var(--lj-weight-medium);
}

.hk-desc {
  font-size: var(--lj-text-base);
  color: var(--lj-text);
}

.hk-empty {
  text-align: center;
  padding: var(--lj-space-7) 0;
  color: var(--lj-text-muted);
}

.hk-footer {
  padding: var(--lj-space-3) var(--lj-space-6);
  border-top: 1px solid var(--lj-surface-divider);
  background: var(--lj-surface-bg-soft);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.hk-tip {
  display: inline-flex;
  align-items: center;
  font-size: var(--lj-text-sm);
  color: var(--lj-text-muted);
}
</style>
