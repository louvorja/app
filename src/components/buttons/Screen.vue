<template>
  <v-btn-group v-if="!is_mobile" :variant="variant" style="overflow: clip">
    <v-btn
      :size="size"
      :active="is_active"
      :icon="iconName"
      :title="$t('settings.slides.open_at')"
      @click="primaryClick()"
    />

    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn v-bind="menuProps" :size="size" icon="mdi-chevron-down" density="compact" />
      </template>

      <v-list density="compact" min-width="260">
        <v-list-subheader>{{ $t("settings.slides.open_at") }}</v-list-subheader>

        <!-- Padrão (herdado) — só aparece quando há grupo de fallback -->
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
          <v-list-item-title>
            {{ $t("settings.monitors.use_default") }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ fallback_label }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item :active="explicit_id === null && !is_active" @click="choose(null)">
          <template #prepend>
            <v-icon size="18">{{ explicit_id === null ? "mdi-check" : "" }}</v-icon>
          </template>
          <v-list-item-title>{{ $t("settings.slides.same_window") }}</v-list-item-title>
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
              ({{ $t("settings.monitors.primary_short") }})
            </span>
          </v-list-item-title>
          <v-list-item-subtitle>{{ d.bounds.width }}×{{ d.bounds.height }}</v-list-item-subtitle>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item :disabled="!can_identify" @click="identify()">
          <template #prepend>
            <v-icon size="18">mdi-magnify</v-icon>
          </template>
          <v-list-item-title>{{ $t("settings.monitors.identify") }}</v-list-item-title>
        </v-list-item>

        <v-list-item v-if="is_active" @click="closeOpen()">
          <template #prepend>
            <v-icon size="18">mdi-close</v-icon>
          </template>
          <v-list-item-title>{{ $t("popup.close") }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn-group>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import AppData from "@/helpers/AppData";
import Platform from "@/helpers/Platform";
import Popup from "@/helpers/Popup";
import Projection, {
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
  /** Identificador único da projeção (ex: "bible", "music"). Default: derivado de `module`. */
  feature: { type: String, default: null },
  /** Rota a abrir como projeção (ex: "/obs/bible"). Default: derivado de `module`. */
  route: { type: String, default: null },
  /** Modo retrocompat — abre Popup do módulo se feature/route não forem fornecidos. */
  module: { type: String, default: null },
  size: { type: String, default: "small" },
  variant: { type: String, default: "text" },
  fullscreen: { type: Boolean, default: true },
  alwaysOnTop: { type: Boolean, default: false },
  /** Ícone ativo quando aberto / inativo quando fechado. */
  icon: { type: String, default: "mdi-projector-screen-outline" },
});

const ROUTE_BY_MODULE = {
  bible: "/projection/bible",
  media: "/projection",
  music: "/projection",
  // Genéricos — usam ModuleProjection.vue lendo ?module=<id>
  message_board: "/projection/module?module=message_board",
  draw: "/projection/module?module=draw",
  name_draw: "/projection/module?module=name_draw",
  counter: "/projection/module?module=counter",
  clock: "/projection/module?module=clock",
  stopwatch: "/projection/module?module=stopwatch",
};

const is_mobile = computed(() => AppData.get("is_mobile"));

const featureName = computed(() => props.feature || props.module || "default");
const routePath = computed(() => props.route || ROUTE_BY_MODULE[props.module] || null);
const isProjectionMode = computed(() => !!routePath.value);

// Estado do Popup tradicional (legacy — para módulos sem route)
const is_popup_opened = computed(() => !!AppData.get("popup"));
const popup_module = computed(() => AppData.get("popup_module"));
const is_popup_selected = computed(
  () => is_popup_opened.value && popup_module.value === props.module
);

// Estado da projeção (novo — feature/route)
const projection_open = ref(false);
const displays = ref([]);
// Effective: o que efetivamente vai abrir (com fallback aplicado)
const effective_id = ref(null);
// Explicit: undefined = "usar padrão herdado"; null = "mesma janela"; number = monitor escolhido
const explicit_id = ref(undefined);

const fallback_feature = computed(() => getFallbackFeature(featureName.value));
const fallback_label = computed(() => {
  const f = fallback_feature.value;
  if (!f) return "";
  // Resolve o nome amigável da feature herdada
  if (f === "musicas") return "Slides de músicas";
  if (f === "retorno") return "Stage Display (Retorno)";
  if (f === "operador") return "Operador";
  return f;
});

const is_active = computed(() =>
  isProjectionMode.value ? projection_open.value : is_popup_selected.value
);

const iconName = computed(() => props.icon);

const can_identify = computed(() => Platform.isDesktop && displays.value.length > 1);

async function refreshDisplays() {
  if (!isProjectionMode.value) return;
  displays.value = await listDisplays();
  // explicit: só leitura crua da feature (sem fallback)
  const explicit = await getPreferredMonitor(featureName.value, { explicit: true });
  const usingFallback = await isUsingFallback(featureName.value);
  explicit_id.value = usingFallback ? undefined : explicit;
  // effective: com fallback aplicado — esse é quem abre a janela
  effective_id.value = await getPreferredMonitor(featureName.value);
  projection_open.value = await isProjectionOpen(featureName.value);
}

function legacyPopup() {
  if (is_popup_selected.value) Popup.exit();
  else Popup.open(props.module);
}

async function primaryClick() {
  if (!isProjectionMode.value) {
    legacyPopup();
    return;
  }
  // Toggle abrir/fechar usando preferência efetiva (com fallback)
  if (projection_open.value) {
    await closeProjection(featureName.value);
  } else {
    await openProjection({
      feature: featureName.value,
      route: routePath.value,
      monitorId: effective_id.value,
      fullscreen: props.fullscreen,
      alwaysOnTop: props.alwaysOnTop,
    });
  }
  await refreshDisplays();
}

/**
 * displayId:
 *   undefined → "Padrão herdado" (limpa explícito, usa fallback do grupo)
 *   null      → "Mesma janela"
 *   number    → Monitor específico
 */
async function choose(displayId) {
  if (!isProjectionMode.value) return;
  // setPreferredMonitor com null limpa a preferência. Para "Padrão herdado"
  // (undefined), também passamos null para limpar o explícito.
  const toSave = displayId === undefined ? null : displayId;
  await setPreferredMonitor(featureName.value, toSave);
  await refreshDisplays();

  if (effective_id.value == null) {
    // "Mesma janela" ou fallback resultou em null — fecha projeção aberta
    if (projection_open.value) await closeProjection(featureName.value);
  } else {
    // Re-abre no monitor efetivo (escolhido ou herdado)
    if (projection_open.value) await closeProjection(featureName.value);
    await openProjection({
      feature: featureName.value,
      route: routePath.value,
      monitorId: effective_id.value,
      fullscreen: props.fullscreen,
      alwaysOnTop: props.alwaysOnTop,
    });
  }
  await refreshDisplays();
}

async function closeOpen() {
  if (isProjectionMode.value) {
    await closeProjection(featureName.value);
    await refreshDisplays();
  } else {
    Popup.close();
  }
}

async function identify() {
  await identifyDisplays(5000);
}

let pollTimer = null;
onMounted(async () => {
  await refreshDisplays();
  // Polling leve para refletir abertura/fechamento externo (ex: usuário fechou
  // a janela da projeção pelo X). 2s é suficiente — operação raramente urgente.
  if (isProjectionMode.value) {
    pollTimer = setInterval(async () => {
      const open = await isProjectionOpen(featureName.value);
      if (open !== projection_open.value) projection_open.value = open;
    }, 2000);
  }
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

watch([() => props.module, () => props.feature, () => props.route], () => {
  refreshDisplays();
});
</script>

<style scoped></style>
