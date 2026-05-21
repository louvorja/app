<template>
  <!-- Modo POPUP (auxiliares como álbum, letra, media): v-dialog Window -->
  <Window
    v-if="popup"
    v-model="show"
    :title="title ?? headerTitle"
    :icon="moduleIcon"
    closable
    :compact="compact"
    :index="index"
    :size="manifest?.moduleOptions?.size ?? null"
    @close="close"
    @scroll="onScroll"
    @has-scroll="onHasScroll"
  >
    <template #header><slot name="header" /></template>
    <template #left><slot name="left" /></template>
    <template #right><slot name="right" /></template>
    <template #footer><slot name="footer" /></template>
    <slot />
  </Window>

  <!-- Modo EMBEDDED (default — replica PageControl Delphi) -->
  <div v-else-if="show" v-show="isActiveEmbedded" class="module-embedded">
    <header class="module-embedded-header">
      <div v-if="moduleIcon" class="module-embedded-icon">
        <v-icon :icon="moduleIcon" size="18" />
      </div>
      <div class="module-embedded-title">
        {{ headerTitle }}
      </div>
      <div v-if="$slots.header" class="module-embedded-slot-header">
        <slot name="header" />
      </div>
      <button
        type="button"
        class="module-embedded-action module-embedded-action--close"
        :title="$t('alert.close')"
        @click="close"
      >
        <v-icon icon="mdi-close" size="14" />
      </button>
    </header>

    <div class="module-embedded-body">
      <aside v-if="$slots.left" class="module-embedded-left">
        <slot name="left" />
      </aside>
      <main class="module-embedded-content">
        <slot />
      </main>
      <aside v-if="$slots.right" class="module-embedded-right">
        <slot name="right" />
      </aside>
    </div>

    <footer v-if="$slots.footer" class="module-embedded-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Window from "@/components/Window.vue";
import Modules from "@/helpers/Modules";
import AppData from "@/helpers/AppData";
import UserData from "@/helpers/UserData";

const props = defineProps({
  manifest: { type: Object, required: true },
  title: { type: String, default: null },
  compact: { type: Boolean, default: false },
  index: { type: [Boolean, Number, String], default: null },
  /** Quando true, renderiza como popup v-dialog. Default false (embedded inline). */
  popup: { type: Boolean, default: false },
  /**
   * Callback síncrono ou assíncrono executado antes de fechar.
   * Retornar `false` (ou Promise<false>) cancela o fechamento.
   */
  beforeClose: { type: Function, default: null },
});

const emit = defineEmits(["close", "minimize", "scroll", "hasScroll", "show"]);

const { t: i18nT } = useI18n();

const moduleId = computed(() => props.manifest?.id);

const module_ = computed(() => (moduleId.value && Modules.get(moduleId.value)) || {});

const show = computed({
  get() {
    if (!moduleId.value) return false;
    return AppData.get(`modules.${moduleId.value}.show`) === true;
  },
  set(v) {
    if (moduleId.value) {
      AppData.set(`modules.${moduleId.value}.show`, v);
    }
  },
});

const isActiveEmbedded = computed(() => {
  if (props.popup) return true;
  if (!moduleId.value) return false;

  return AppData.get("active_module") === moduleId.value;
});

const moduleIcon = computed(() => module_.value?.icon || props.manifest?.icon || null);

const headerTitle = computed(() => {
  if (props.title) return props.title;
  if (!props.manifest) return "";
  const key = `modules.${moduleId.value}.title`;
  const translated = i18nT(key);
  if (translated && translated !== key) return translated;
  return props.manifest.name || moduleId.value || "";
});

watch(show, (v) => {
  emit("show", v);
});

async function close() {
  if (props.beforeClose) {
    try {
      const result = await props.beforeClose();
      if (result === false) return;
    } catch {
      return;
    }
  }
  Modules.close(moduleId.value);
  emit("close");
}

function onScroll() {
  emit("scroll");
}
function onHasScroll() {
  emit("hasScroll");
}

onMounted(() => {
  if (moduleId.value) {
    AppData.set(`modules.${moduleId.value}.popup`, props.popup);
  }
});

// Métodos expostos para módulos que usam ref="moduleContainer" (musics, etc.)
const userdata = computed(() => {
  const id = moduleId.value;
  return new Proxy(
    {},
    {
      get: (_, key) => UserData.get(`modules.${id}.${String(key)}`, null),
      set: (_, key, value) => {
        UserData.set(`modules.${id}.${String(key)}`, value);
        return true;
      },
    }
  );
});

const t = (key) => i18nT(`modules.${moduleId.value}.${key}`);

defineExpose({ userdata, t, moduleId, module: module_ });
</script>

<style scoped>
.module-embedded {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--lj-surface-bg);
  color: var(--lj-text);
  overflow: hidden;
  font-family: var(--lj-font-shell);
}

.module-embedded-header {
  display: flex;
  align-items: center;
  gap: var(--lj-space-4);
  padding: var(--lj-space-3) var(--lj-space-5);
  background: var(--lj-surface-bg-soft);
  border-bottom: 1px solid var(--lj-surface-border);
  flex-shrink: 0;
  min-height: 38px;
}

.module-embedded-icon {
  display: flex;
  align-items: center;
  color: var(--lj-navy);
}

.module-embedded-title {
  font-weight: var(--lj-weight-medium);
  font-size: var(--lj-text-lg);
  white-space: nowrap;
}

.module-embedded-slot-header {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  min-width: 0;
}

.module-embedded-action {
  width: 28px;
  height: 24px;
  margin-left: auto;
  border: none;
  background: transparent;
  border-radius: var(--lj-radius-sm);
  cursor: pointer;
  color: var(--lj-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--lj-transition-normal),
    color var(--lj-transition-normal);
  font-family: inherit;
}

.module-embedded-action:hover {
  background: var(--lj-hover-bg);
  color: var(--lj-text);
}

.module-embedded-action--close:hover {
  background: var(--lj-danger);
  color: var(--lj-white);
}

.module-embedded-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.module-embedded-left,
.module-embedded-right {
  flex-shrink: 0;
  border-right: 1px solid var(--lj-surface-border);
  overflow: auto;
}

.module-embedded-right {
  border-right: none;
  border-left: 1px solid var(--lj-surface-border);
}

.module-embedded-content {
  flex: 1;
  overflow: auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.module-embedded-footer {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  padding: var(--lj-space-3) var(--lj-space-5);
  background: var(--lj-surface-bg-soft);
  border-top: 1px solid var(--lj-surface-border);
  flex-shrink: 0;
  min-height: 38px;
}
</style>
