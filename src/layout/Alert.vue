<template>
  <v-dialog v-model="show" max-width="480" persistent>
    <div class="alert" :class="`alert--${variant}`">
      <header v-if="alert.title" class="alert-header">
        <v-icon :icon="iconForVariant" size="20" class="alert-header-icon" />
        <h3 class="alert-title">
          <span v-if="alert.translate" v-html="$t(alert.title)" />
          <span v-else v-html="alert.title" />
        </h3>
      </header>

      <div v-if="alert.text" class="alert-body">
        <p class="alert-text">
          <span v-if="alert.translate" v-html="$t(alert.text)" />
          <span v-else v-html="alert.text" />
        </p>
        <small v-if="alert.error" class="alert-error" v-html="alert.error" />
      </div>

      <footer class="alert-actions">
        <button
          v-for="(btn, index) in alert.buttons"
          :key="index"
          type="button"
          class="alert-btn"
          :class="`alert-btn--${btn.color || 'default'}`"
          @click="clickBtn(btn.value)"
        >
          {{ $t(btn.text) }}
        </button>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import $appdata from "@/helpers/AppData";

const alert = computed(() => $appdata.get("alert"));

const show = computed({
  get: () => alert.value?.show === true,
  set: (v) => $appdata.set("alert.show", v),
});

const variant = computed(() => alert.value?.color || "info");

const iconForVariant = computed(() => {
  const map = {
    error: "mdi-alert-circle",
    success: "mdi-check-circle",
    warning: "mdi-alert",
    info: "mdi-information",
  };
  return map[variant.value] || "mdi-information-outline";
});

function clickBtn(value) {
  $appdata.set("alert.value", value);
  $appdata.set("alert.show", false);
}
</script>

<style scoped>
.alert {
  background: var(--lj-popup-bg);
  border-radius: var(--lj-radius-md);
  box-shadow: var(--lj-popup-shadow);
  font-family: var(--lj-font-shell);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  padding: var(--lj-space-5) var(--lj-space-6) var(--lj-space-3);
  border-bottom: 1px solid var(--lj-surface-divider);
}

.alert-header-icon {
  flex-shrink: 0;
  color: var(--lj-navy);
}

.alert--error .alert-header-icon {
  color: var(--lj-danger);
}
.alert--success .alert-header-icon {
  color: var(--lj-success);
}
.alert--warning .alert-header-icon {
  color: var(--lj-warning);
}

.alert-title {
  margin: 0;
  font-size: var(--lj-text-lg);
  font-weight: var(--lj-weight-semibold);
  color: var(--lj-text);
}

.alert-body {
  padding: var(--lj-space-5) var(--lj-space-6);
  color: var(--lj-text);
}

.alert-text {
  margin: 0;
  font-size: var(--lj-text-base);
  line-height: 1.5;
  color: var(--lj-text);
}

.alert-error {
  display: block;
  margin-top: var(--lj-space-3);
  padding: var(--lj-space-3);
  background: var(--lj-danger-soft);
  border-left: 3px solid var(--lj-danger);
  border-radius: var(--lj-radius-sm);
  font-size: var(--lj-text-sm);
  color: var(--lj-alert-error-color);
  font-family: var(--lj-font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--lj-space-3);
  padding: var(--lj-space-3) var(--lj-space-6);
  border-top: 1px solid var(--lj-surface-divider);
  background: var(--lj-surface-bg-soft);
}

.alert-btn {
  display: inline-flex;
  align-items: center;
  padding: var(--lj-space-2) var(--lj-space-5);
  background: var(--lj-surface-bg);
  border: 1px solid var(--lj-surface-border-strong);
  border-radius: var(--lj-radius-sm);
  font-size: var(--lj-text-base);
  font-weight: var(--lj-weight-medium);
  color: var(--lj-text);
  cursor: pointer;
  transition:
    background var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
  font-family: inherit;
  min-width: 80px;
  justify-content: center;
}

.alert-btn:hover {
  background: var(--lj-surface-bg-hover);
  border-color: var(--lj-navy);
}

.alert-btn--info,
.alert-btn--primary {
  background: var(--lj-navy);
  color: var(--lj-white);
  border-color: var(--lj-navy-dark);
}

.alert-btn--info:hover,
.alert-btn--primary:hover {
  background: var(--lj-navy-active);
  border-color: var(--lj-navy);
  color: var(--lj-white);
}

.alert-btn--error {
  color: var(--lj-danger-dark);
  border-color: var(--lj-danger);
}

.alert-btn--error:hover {
  background: var(--lj-danger);
  color: var(--lj-white);
  border-color: var(--lj-danger-dark);
}

.alert-btn--success {
  background: var(--lj-success);
  color: var(--lj-white);
  border-color: var(--lj-success);
}
</style>
