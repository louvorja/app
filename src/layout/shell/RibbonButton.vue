<template>
  <button
    type="button"
    class="ribbon-btn"
    :class="[`ribbon-btn--${size}`, { 'ribbon-btn--active': active }]"
    :title="label"
    :data-testid="testid"
    @click="$emit('click', $event)"
  >
    <v-icon
      :icon="icon"
      :size="size === 'large' ? 32 : 16"
      :style="iconColor ? { color: iconColor } : null"
      class="ribbon-btn-icon"
    />
    <span class="ribbon-btn-label">{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  size: { type: String, default: "large" },
  active: { type: Boolean, default: false },
  iconColor: { type: String, default: null },
  testid: { type: String, default: null },
});

defineEmits(["click"]);
</script>

<style scoped>
.ribbon-btn {
  display: flex;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  border-radius: var(--lj-radius-sm);
  color: var(--lj-rbtn-color);
  transition:
    background var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
  outline: none;
  user-select: none;
  font-family: var(--lj-font-shell);
}

.ribbon-btn:hover {
  background: var(--lj-rbtn-hover-bg);
  border-color: var(--lj-rbtn-hover-border);
}

.ribbon-btn--active {
  background: var(--lj-rbtn-active-bg);
  border-color: var(--lj-rbtn-active-border);
}

/* Botão grande: ícone topo + label embaixo */
.ribbon-btn--large {
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: var(--lj-large-btn-width);
  min-height: var(--lj-large-btn-height);
  padding: var(--lj-space-2);
  gap: var(--lj-space-1);
}

.ribbon-btn--large .ribbon-btn-icon {
  flex-shrink: 0;
}

.ribbon-btn--large .ribbon-btn-label {
  font-size: var(--lj-text-sm);
  text-align: center;
  line-height: 1.15;
  word-break: break-word;
  hyphens: auto;
  max-width: 70px;
  color: inherit;
  font-weight: var(--lj-weight-regular);
}

/* Botão pequeno horizontal — empilha em coluna no group */
.ribbon-btn--small {
  flex-direction: row;
  align-items: center;
  height: var(--lj-small-btn-height);
  padding: 0 var(--lj-space-3);
  width: 100%;
  min-width: 110px;
  gap: var(--lj-space-2);
  flex-shrink: 0;
}

.ribbon-btn--small .ribbon-btn-icon {
  flex-shrink: 0;
}

.ribbon-btn--small .ribbon-btn-label {
  font-size: var(--lj-text-base);
  white-space: nowrap;
  font-weight: var(--lj-weight-regular);
  text-align: left;
  flex: 1;
}
</style>
