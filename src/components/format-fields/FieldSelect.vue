<template>
  <select
    :value="modelValue || ''"
    class="format-field format-field--input"
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <option v-for="opt in options" :key="opt" :value="opt">{{ optionLabel(opt) }}</option>
  </select>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  modelValue: { type: [String, null], default: null },
  field: { type: Object, required: true },
});
defineEmits(["update:modelValue"]);

const { t } = useI18n();

const options = computed(() => props.field.options || []);

const LABELS = {
  start: "components.format_panel.align_start",
  center: "components.format_panel.align_center",
  end: "components.format_panel.align_end",
  cover: "components.format_panel.fit_cover",
  contain: "components.format_panel.fit_contain",
  fill: "components.format_panel.fit_fill",
  none: "components.format_panel.fit_none",
  // Formatos de data (clock)
  long: "components.format_panel.date_long",
  medium: "components.format_panel.date_medium",
  short: "components.format_panel.date_short",
  weekday: "components.format_panel.date_weekday",
  month_year: "components.format_panel.date_month_year",
  weekday_only: "components.format_panel.date_weekday_only",
  // Formatos de hora (clock — já existente no manifest)
  "12h": "components.format_panel.time_12h",
  "24h": "components.format_panel.time_24h",
  "hh:mm:ss": "components.format_panel.time_hms",
  "hh:mm": "components.format_panel.time_hm",
};

function optionLabel(opt) {
  const key = LABELS[opt];
  if (!key) return opt;
  const translated = t(key);
  return translated && translated !== key ? translated : opt;
}
</script>

<style scoped>
.format-field--input {
  font-size: 12px;
  padding: 4px 6px;
  border: 1px solid var(--lj-surface-border);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: inherit;
  width: 100%;
  box-sizing: border-box;
}
</style>
