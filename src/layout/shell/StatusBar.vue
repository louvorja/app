<template>
  <div class="statusbar">
    <div class="statusbar-cell statusbar-cell--main">{{ pcName }}</div>
    <div class="statusbar-cell statusbar-cell--num">{{ dateLabel }}</div>
    <div class="statusbar-cell statusbar-cell--num">{{ timeLabel }}</div>
    <div class="statusbar-cell statusbar-cell--version">{{ versionLabel }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import packageJson from "@root/package.json";
import $database from "@/helpers/Database";

const { t } = useI18n();

const dateLabel = ref("");
const timeLabel = ref("");
const dbVersion = ref(0);
let clockInterval = null;

const versionLabel = computed(() =>
  t("shell.version", { v: `${packageJson.version}.${dbVersion.value}` })
);

const pcName = computed(() => {
  if (typeof window === "undefined") return "PC";
  return "PC-" + (window.louvorjaApi?.platform || "WEB").toUpperCase();
});

function pad(n) {
  return String(n).padStart(2, "0");
}

function tick() {
  const now = new Date();
  dateLabel.value = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  timeLabel.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

async function loadDBVersion() {
  try {
    const config = await $database.get("config");
    dbVersion.value = config?.version_number ?? "?";
  } catch {
    dbVersion.value = "?";
  }
}

onMounted(() => {
  tick();
  clockInterval = setInterval(tick, 1000);
  loadDBVersion();
});

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval);
});
</script>

<style scoped>
.statusbar {
  display: flex;
  align-items: stretch;
  height: var(--lj-statusbar-height);
  background: var(--lj-statusbar-bg);
  border-top: 1px solid var(--lj-statusbar-border);
  flex-shrink: 0;
  font-size: var(--lj-text-sm);
  color: var(--lj-statusbar-color);
  user-select: none;
  font-family: var(--lj-font-shell);
}

.statusbar-cell {
  display: flex;
  align-items: center;
  padding: 0 var(--lj-space-5);
  border-right: 1px solid var(--lj-statusbar-divider);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.statusbar-cell:last-child {
  border-right: none;
}

.statusbar-cell--main {
  flex: 1;
  min-width: 0;
}

.statusbar-cell--num {
  flex: 0 0 auto;
  min-width: 80px;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

.statusbar-cell--version {
  flex: 0 0 auto;
  min-width: 130px;
  justify-content: flex-end;
}
</style>
