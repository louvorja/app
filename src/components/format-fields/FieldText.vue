<template>
  <input
    type="text"
    :value="modelValue || ''"
    class="format-field format-field--input"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: [String, null], default: null },
  field: { type: Object, required: true },
});
defineEmits(["update:modelValue"]);
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
