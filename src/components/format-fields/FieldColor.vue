<template>
  <input
    type="color"
    :value="modelValue || '#000000'"
    class="format-field format-field--color"
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
.format-field--color {
  width: 100%;
  height: 26px;
  padding: 0;
  border: 1px solid var(--lj-surface-border);
  border-radius: 3px;
  cursor: pointer;
  background: transparent;
}
</style>
