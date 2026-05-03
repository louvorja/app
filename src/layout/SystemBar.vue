<template>
  <div
    v-if="isDesktop"
    class="systembar"
    :class="{ 'systembar--mac': isMac }"
    @dblclick="toggleMaximize"
  >
    <div class="systembar-drag">
      <span class="systembar-title">{{ title }}</span>
    </div>

    <div v-if="!isMac" class="systembar-controls">
      <button
        type="button"
        class="systembar-btn"
        :title="$t('shell.window.minimize')"
        @click="minimize"
      >
        <v-icon icon="mdi-window-minimize" size="14" />
      </button>
      <button
        type="button"
        class="systembar-btn"
        :title="isMaximized ? $t('shell.window.restore') : $t('shell.window.maximize')"
        @click="toggleMaximize"
      >
        <v-icon :icon="isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize'" size="14" />
      </button>
      <button
        type="button"
        class="systembar-btn systembar-btn--close"
        :title="$t('shell.window.close')"
        @click="closeWindow"
      >
        <v-icon icon="mdi-close" size="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from "vue";
import Platform from "@/helpers/Platform";

const { proxy } = getCurrentInstance();

const isMaximized = ref(false);
let unsubscribe = null;

const isDesktop = computed(() => proxy.$appdata.get("is_desktop"));
const isMac = computed(() => Platform.platform === "darwin");

const activeModuleId = computed(() => {
  const modules = proxy.$appdata.get("modules") || {};
  const skip = new Set(["media", "lyric", "album"]);
  const ids = Object.keys(modules).reverse();
  for (const id of ids) {
    if (skip.has(id)) continue;
    if (modules[id]?.show === true) return id;
  }
  return null;
});

const title = computed(() => {
  if (!activeModuleId.value) return "Louvor JA";
  const key = `modules.${activeModuleId.value}.title`;
  const t = proxy.$t(key);
  const moduleTitle = t === key ? activeModuleId.value.replace(/_/g, " ") : t;
  return `${moduleTitle} - Louvor JA`;
});

async function minimize() {
  try {
    await Platform.window?.minimize();
  } catch (_) {
    /* ignore */
  }
}

async function toggleMaximize() {
  try {
    const res = await Platform.window?.toggleMaximize();
    if (res && typeof res.maximized === "boolean") isMaximized.value = res.maximized;
  } catch (_) {
    /* ignore */
  }
}

async function closeWindow() {
  try {
    await Platform.window?.close();
  } catch (_) {
    /* ignore */
  }
}

async function syncMaximized() {
  try {
    const v = await Platform.window?.isMaximized();
    if (typeof v === "boolean") isMaximized.value = v;
  } catch (_) {
    /* ignore */
  }
}

onMounted(async () => {
  if (Platform.window?.onMaximizeChange) {
    unsubscribe = Platform.window.onMaximizeChange((v) => {
      isMaximized.value = v;
    });
  }
  await syncMaximized();
});

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.systembar {
  display: flex;
  align-items: stretch;
  height: var(--lj-systembar-height);
  background: var(--lj-titlebar-bg);
  color: var(--lj-titlebar-color);
  font-size: var(--lj-text-base);
  user-select: none;
  flex-shrink: 0;
  -webkit-app-region: drag;
  font-family: var(--lj-font-shell);
}

.systembar-drag {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--lj-space-5);
  overflow: hidden;
  white-space: nowrap;
  -webkit-app-region: drag;
}

.systembar--mac .systembar-drag {
  padding-left: 78px;
  padding-right: var(--lj-space-5);
}

.systembar-title {
  font-weight: var(--lj-weight-medium);
  letter-spacing: 0.02em;
  opacity: 0.95;
}

.systembar-controls {
  display: flex;
  align-items: stretch;
  -webkit-app-region: no-drag;
}

.systembar-btn {
  width: 44px;
  height: var(--lj-systembar-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--lj-white);
  cursor: pointer;
  transition: background var(--lj-transition-fast);
  outline: none;
  opacity: 0.85;
  font-family: inherit;
}

.systembar-btn:hover {
  background: var(--lj-white-alpha-18);
  opacity: 1;
}

.systembar-btn--close:hover {
  background: var(--lj-danger);
  opacity: 1;
}
</style>
