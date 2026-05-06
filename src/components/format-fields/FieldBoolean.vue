<template>
  <label class="format-field--boolean">
    <input
      type="checkbox"
      :checked="!!modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span class="format-field--boolean__indicator"></span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: [Boolean, null], default: false },
  field: { type: Object, required: true },
});
defineEmits(["update:modelValue"]);
</script>

<style scoped>
.format-field--boolean {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  height: 26px;
}

.format-field--boolean input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.format-field--boolean__indicator {
  position: relative;
  width: 36px;
  height: 18px;
  border-radius: 999px;
  background: var(--lj-surface-border, #ccc);
  transition: background 0.15s ease;
}

.format-field--boolean__indicator::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.format-field--boolean input:checked + .format-field--boolean__indicator {
  background: var(--lj-primary, #1b4f8a);
}

.format-field--boolean input:checked + .format-field--boolean__indicator::after {
  transform: translateX(18px);
}
</style>
