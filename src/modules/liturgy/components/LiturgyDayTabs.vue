<template>
  <nav class="lit-daytabs">
    <button
      v-for="(label, i) in dayLabels"
      :key="i"
      class="lit-daytab"
      :class="{ 'is-active': activeDay === i, 'is-today': i === todayIndex }"
      :title="label"
      @click="setActiveDay(i)"
    >
      <v-icon :icon="i === todayIndex ? 'mdi-calendar-star' : 'mdi-calendar-blank'" size="16" />
      <span>{{ label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    activeDay?: number;
    dayLabels?: string[];
    todayIndex?: number;
    setActiveDay: (index: number) => void;
  }>(),
  {
    activeDay: 0,
    dayLabels: () => [],
    todayIndex: 0,
  }
);

void props;
</script>

<style scoped>
.lit-daytabs {
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 6px 8px;
  background: var(--lj-surface-bg);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
}

.lit-daytab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid rgba(var(--v-border-color), 0.3);
  border-radius: 3px;
  cursor: pointer;
  color: var(--lj-text);
  font-size: 12px;
  transition:
    background 0.12s,
    border 0.12s;
  white-space: nowrap;
}
.lit-daytab:hover {
  background: rgba(var(--lj-on-surface-ch), 0.06);
}
.lit-daytab.is-active {
  background: rgba(var(--lj-on-surface-ch), 0.1);
  border-color: rgba(var(--lj-navy-ch), 0.6);
  font-weight: 600;
}
.lit-daytab.is-today :deep(.v-icon) {
  color: #f7c948;
}
</style>
