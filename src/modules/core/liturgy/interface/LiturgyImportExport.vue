<template>
  <div class="lif-wrapper">
    <button class="lit-btn lit-btn--ghost" :title="t('actions.save')" @click="$emit('save')">
      <v-icon icon="mdi-content-save-outline" size="16" />
    </button>
    <button class="lit-btn lit-btn--ghost" :title="t('actions.load')" @click="triggerLoad">
      <v-icon icon="mdi-folder-open-outline" size="16" />
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".json,.ja"
      style="display: none"
      @change="$emit('file-load', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import pt from "../lang/pt.json";
import es from "../lang/es.json";

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

defineEmits<{ save: []; "file-load": [Event] }>();

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);

const fileInput = ref<HTMLInputElement | null>(null);

function triggerLoad() {
  fileInput.value?.click();
}
</script>

<style scoped>
.lif-wrapper {
  display: contents;
}

/* Botões duplicados localmente para funcionar dentro do teleport do v-dialog */
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
.lit-btn--ghost {
  background: transparent;
  border: 1px solid transparent;
}
.lit-btn--ghost:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
  border-color: rgba(var(--v-border-color), 0.4);
}
</style>
