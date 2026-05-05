<template>
  <div class="ribbon-group">
    <div class="ribbon-group-content">
      <slot />
    </div>
    <div class="ribbon-group-label">{{ title }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
});
</script>

<style scoped>
.ribbon-group {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--lj-body-divider);
  padding: var(--lj-space-2) var(--lj-space-3) 0;
  flex-shrink: 0;
  height: 100%;
}

.ribbon-group:last-child {
  border-right: none;
}

.ribbon-group-content {
  display: flex;
  flex-flow: column wrap;
  align-items: flex-start;
  flex: 1;
  gap: var(--lj-space-1);
  padding: var(--lj-space-1) 0;
  min-height: 0;
  /* Limita a 3 botões small empilhados em coluna (estilo Office Ribbon).
     Botões large quebram em coluna nova naturalmente.
     overflow: hidden previne sobreposição visual com o label do grupo
     se o conteúdo tentar estourar. */
  max-height: calc(var(--lj-ribbon-body-height) - var(--lj-group-label-height) - 8px);
  overflow: hidden;
  align-content: flex-start;
}

.ribbon-group-label {
  height: var(--lj-group-label-height);
  text-align: center;
  font-size: var(--lj-text-xs);
  color: var(--lj-group-label-color);
  letter-spacing: 0.02em;
  padding: 2px var(--lj-space-2) 3px;
  white-space: nowrap;
  font-weight: var(--lj-weight-regular);
}
</style>
