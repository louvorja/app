<template>
  <input
    type="number"
    :value="modelValue ?? ''"
    :min="min"
    :max="max"
    class="format-field format-field--number"
    @input="$emit('update:modelValue', Number($event.target.value))"
  />
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: [Number, null], default: null },
  field: { type: Object, required: true },
});
defineEmits(["update:modelValue"]);

const min = computed(() => (props.field.type === "opacity" ? 0 : 1));
const max = computed(() => {
  if (props.field.type === "opacity") return 100;
  if (props.field.type === "border-spacing") return 50;
  return 200;
});
</script>

<style scoped>
.format-field--number {
  font-size: 12px;
  padding: 4px 6px;
  border: 1px solid var(--lj-surface-border);
  border-radius: 3px;
  background: var(--lj-surface-bg);
  color: inherit;
  width: 80px;
  box-sizing: border-box;
}
</style>
