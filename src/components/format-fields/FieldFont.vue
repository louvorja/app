<template>
  <select
    :value="modelValue || ''"
    class="format-field format-field--input"
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <option value="">—</option>
    <option v-for="f in FORMAT_FONT_OPTIONS" :key="f" :value="f">{{ f }}</option>
  </select>
</template>

<script setup>
import { FORMAT_FONT_OPTIONS } from "@/composables/useModuleFormat";

defineProps({
  modelValue: { type: [String, null], default: null },
  field: { type: Object, required: true },
});
defineEmits(["update:modelValue"]);
</script>

<style scoped>
.format-field {
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
