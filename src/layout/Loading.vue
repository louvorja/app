<template>
  <v-dialog v-model="show" max-width="340" persistent>
    <div class="loading">
      <div class="loading-spinner">
        <v-progress-circular color="primary" indeterminate size="32" width="3" />
      </div>
      <div class="loading-content">
        <div class="loading-title">LouvorJA</div>
        <div class="loading-message">{{ $t("alert.wait") }}</div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, getCurrentInstance } from "vue";

const { proxy } = getCurrentInstance();

const show = computed({
  get: () => proxy.$appdata.get("loading"),
  set: (v) => proxy.$appdata.set("loading", v),
});
</script>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  gap: var(--lj-space-5);
  padding: var(--lj-space-5) var(--lj-space-7);
  background: var(--lj-popup-bg);
  border-radius: var(--lj-radius-md);
  box-shadow: var(--lj-popup-shadow);
  font-family: var(--lj-font-shell);
}

.loading-spinner {
  flex-shrink: 0;
}

.loading-content {
  flex: 1;
  min-width: 0;
}

.loading-title {
  font-size: var(--lj-text-lg);
  font-weight: var(--lj-weight-semibold);
  color: var(--lj-text);
  letter-spacing: 0.02em;
}

.loading-message {
  font-size: var(--lj-text-base);
  color: var(--lj-text-muted);
  margin-top: 2px;
}
</style>
