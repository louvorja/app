<template>
  <div class="ribbon-screen-btn" :class="`ribbon-btn--${size}`">
    <button
      type="button"
      class="ribbon-btn ribbon-btn--main"
      :class="[`ribbon-btn--${size}`, { 'ribbon-btn--active': is_active }]"
      :title="label"
      :data-testid="testid"
      @click="primaryClick"
    >
      <v-icon
        :icon="icon"
        :size="size === 'large' ? 32 : 16"
        :style="iconColor ? { color: iconColor } : null"
        class="ribbon-btn-icon"
      />
      <span class="ribbon-btn-label">{{ label }}</span>
    </button>

    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <button
          v-bind="menuProps"
          type="button"
          class="ribbon-screen-btn__chevron"
          :title="$t('options.slides.open_at')"
          @click.stop
        >
          <v-icon icon="mdi-chevron-down" size="14" />
        </button>
      </template>

      <v-list density="compact" min-width="260">
        <v-list-subheader>{{ $t("options.slides.open_at") }}</v-list-subheader>

        <v-list-item
          v-if="fallback_feature"
          :active="explicit_id === undefined && !is_active"
          @click="choose(undefined)"
        >
          <template #prepend>
            <v-icon size="18">
              {{ explicit_id === undefined ? "mdi-check" : "mdi-link-variant" }}
            </v-icon>
          </template>
          <v-list-item-title>{{ $t("options.monitors.use_default") }}</v-list-item-title>
          <v-list-item-subtitle>{{ fallback_label }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item :active="explicit_id === null && !is_active" @click="choose(null)">
          <template #prepend>
            <v-icon size="18">{{ explicit_id === null ? "mdi-check" : "" }}</v-icon>
          </template>
          <v-list-item-title>{{ $t("options.slides.same_window") }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          v-for="d in displays"
          :key="d.id ?? 'web'"
          :active="explicit_id === d.id"
          @click="choose(d.id)"
        >
          <template #prepend>
            <v-icon size="18">{{ effective_id === d.id ? "mdi-check" : "mdi-monitor" }}</v-icon>
          </template>
          <v-list-item-title>
            {{ d.label }}
            <span v-if="d.primary" class="text-caption text-medium-emphasis ms-1">
              ({{ $t("options.monitors.primary_short") }})
            </span>
          </v-list-item-title>
          <v-list-item-subtitle>{{ d.bounds.width }}×{{ d.bounds.height }}</v-list-item-subtitle>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item :disabled="!can_identify" @click="identify()">
          <template #prepend>
            <v-icon size="18">mdi-magnify</v-icon>
          </template>
          <v-list-item-title>{{ $t("options.monitors.identify") }}</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="is_active" @click="closeOpen()">
          <template #prepend>
            <v-icon size="18">mdi-close</v-icon>
          </template>
          <v-list-item-title>{{ $t("popup.close") }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Platform from "@/helpers/Platform";
import {
  listDisplays,
  getPreferredMonitor,
  setPreferredMonitor,
  identifyDisplays,
  isOpen as isProjectionOpen,
  open as openProjection,
  close as closeProjection,
  getFallbackFeature,
  isUsingFallback,
} from "@/helpers/Projection";

const props = defineProps({
  feature: { type: String, required: true },
  route: { type: String, required: true },
  icon: { type: String, default: "mdi-projector-screen-outline" },
  label: { type: String, default: "" },
  iconColor: { type: String, default: null },
  size: { type: String, default: "large" },
  testid: { type: String, default: null },
  fullscreen: { type: Boolean, default: true },
  alwaysOnTop: { type: Boolean, default: false },
});

const projection_open = ref(false);
const displays = ref([]);
const effective_id = ref(null);
const explicit_id = ref(undefined);

const fallback_feature = computed(() => getFallbackFeature(props.feature));
const fallback_label = computed(() => {
  const f = fallback_feature.value;
  if (!f) return "";
  if (f === "musicas") return "Slides de músicas";
  if (f === "retorno") return "Stage Display (Retorno)";
  if (f === "operador") return "Operador";
  return f;
});

const is_active = computed(() => projection_open.value);
const can_identify = computed(() => Platform.isDesktop && displays.value.length > 1);

async function refresh() {
  displays.value = await listDisplays();
  const explicit = await getPreferredMonitor(props.feature, { explicit: true });
  const usingFallback = await isUsingFallback(props.feature);
  explicit_id.value = usingFallback ? undefined : explicit;
  effective_id.value = await getPreferredMonitor(props.feature);
  projection_open.value = await isProjectionOpen(props.feature);
}

async function primaryClick() {
  if (projection_open.value) {
    await closeProjection(props.feature);
  } else {
    await openProjection({
      feature: props.feature,
      route: props.route,
      monitorId: effective_id.value,
      fullscreen: props.fullscreen,
      alwaysOnTop: props.alwaysOnTop,
    });
  }
  await refresh();
}

async function choose(displayId) {
  const toSave = displayId === undefined ? null : displayId;
  await setPreferredMonitor(props.feature, toSave);
  await refresh();
  if (effective_id.value == null) {
    if (projection_open.value) await closeProjection(props.feature);
  } else {
    if (projection_open.value) await closeProjection(props.feature);
    await openProjection({
      feature: props.feature,
      route: props.route,
      monitorId: effective_id.value,
      fullscreen: props.fullscreen,
      alwaysOnTop: props.alwaysOnTop,
    });
  }
  await refresh();
}

async function closeOpen() {
  await closeProjection(props.feature);
  await refresh();
}

async function identify() {
  await identifyDisplays(5000);
}

let pollTimer = null;
onMounted(async () => {
  await refresh();
  pollTimer = setInterval(async () => {
    const open = await isProjectionOpen(props.feature);
    if (open !== projection_open.value) projection_open.value = open;
  }, 2000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

watch(() => props.feature, refresh);
</script>

<style scoped>
.ribbon-screen-btn {
  position: relative;
  display: flex;
  flex-direction: column;
}

.ribbon-btn {
  display: flex;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  border-radius: var(--lj-radius-sm);
  color: var(--lj-rbtn-color);
  transition:
    background var(--lj-transition-fast),
    border-color var(--lj-transition-fast),
    box-shadow var(--lj-transition-fast),
    transform var(--lj-transition-fast);
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
  max-width: 80px;
  color: inherit;
}

.ribbon-screen-btn__chevron {
  position: absolute;
  bottom: 2px;
  right: 4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--lj-radius-sm);
  cursor: pointer;
  color: var(--lj-text-muted, #888);
  outline: none;
}

.ribbon-screen-btn__chevron:hover {
  background: var(--lj-rbtn-hover-bg);
  border-color: var(--lj-rbtn-hover-border);
}
</style>
