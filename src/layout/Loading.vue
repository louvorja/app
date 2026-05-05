<template>
  <v-dialog v-model="show" max-width="380" persistent>
    <div class="loading">
      <div class="loading-logo">
        <LjLogo :size="48" />
      </div>
      <div class="loading-content">
        <div class="loading-title">
          Louvor
          <b>JA</b>
        </div>
        <div class="loading-message">
          <v-progress-circular color="primary" indeterminate size="14" width="2" class="mr-2" />
          <span>{{ message }}</span>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import $appdata from "@/helpers/AppData";
import LjLogo from "@/components/LjLogo.vue";

const { t } = useI18n();

const show = computed(() => !!$appdata.get("loading"));
const message = computed(() => {
  const val = $appdata.get("loading");
  return typeof val === "string" ? val : t("alert.wait");
});
</script>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  gap: var(--lj-space-5);
  padding: var(--lj-space-6) var(--lj-space-7);
  background: var(--lj-popup-bg);
  border-radius: var(--lj-radius-md);
  box-shadow: var(--lj-popup-shadow);
  font-family: var(--lj-font-shell);
}

.loading-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  flex: 1;
  min-width: 0;
}

.loading-title {
  font-size: var(--lj-text-xl);
  font-weight: var(--lj-weight-semibold);
  color: var(--lj-text);
  letter-spacing: 0.02em;
  line-height: 1;
}

.loading-title b {
  color: var(--lj-orange, #efb400);
  font-weight: var(--lj-weight-bold);
}

.loading-message {
  display: flex;
  align-items: center;
  font-size: var(--lj-text-base);
  color: var(--lj-text-muted);
  margin-top: 8px;
}
</style>
