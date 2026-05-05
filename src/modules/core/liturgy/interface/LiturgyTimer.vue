<template>
  <div v-if="running" class="liturgy-timer" :class="{ 'liturgy-timer--late': timerSeconds < 0 }">
    <v-icon :icon="timerSeconds < 0 ? 'mdi-alert' : 'mdi-timer-outline'" size="16" />
    {{ timerDisplay }}
    <button class="lit-timer-nav" :title="t('actions.prev_item')" @click="$emit('prev')">
      <v-icon icon="mdi-skip-previous" size="14" />
    </button>
    <button class="lit-timer-nav" :title="t('actions.next_item')" @click="$emit('next')">
      <v-icon icon="mdi-skip-next" size="14" />
    </button>
  </div>

  <button
    v-if="hasItems"
    class="lit-btn"
    :class="running ? 'lit-btn--danger' : 'lit-btn--primary'"
    @click="$emit('toggle')"
  >
    <v-icon :icon="running ? 'mdi-stop' : 'mdi-play'" size="16" />
    <span>{{ running ? t("actions.stop") : t("actions.start") }}</span>
  </button>
</template>

<script setup lang="ts">
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

withDefaults(
  defineProps<{
    running?: boolean;
    timerSeconds?: number;
    timerDisplay?: string;
    hasItems?: boolean;
  }>(),
  { running: false, timerSeconds: 0, timerDisplay: "00:00", hasItems: false }
);

defineEmits<{ toggle: []; prev: []; next: [] }>();

const { locale } = useI18n();
const t = (key: string) => _t(key, locale.value);
</script>

<style scoped>
.liturgy-timer {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(var(--lj-navy-ch), 0.1);
  color: var(--lj-navy);
  padding: 4px 8px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  font-size: 13px;
  margin-left: 8px;
}
.liturgy-timer--late {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  animation: pulse-late 1s ease-in-out infinite;
}
@keyframes pulse-late {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
.lit-timer-nav {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  color: inherit;
  padding: 0;
}
.lit-timer-nav:hover {
  background: rgba(var(--lj-on-surface-ch), 0.1);
}

/* Botões do timer — cópia local dos tokens lit-btn de Index.vue */
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
</style>
