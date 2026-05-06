<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '280px' }"
    @close="close()"
  >
    <template #right>
      <v-btn
        icon="mdi-fullscreen"
        variant="text"
        density="compact"
        :title="t('actions.fullscreen')"
        @click="openFullscreen"
      />
    </template>

    <div class="d-flex h-100">
      <aside v-if="show_format" class="format-col">
        <FormatPanel :module-id="'clock'" :manifest="manifest" />
      </aside>
      <div class="d-flex flex-column align-center justify-center pa-6 flex-grow-1" style="gap: 4px">
        <div class="clock-time">{{ time }}</div>
        <div v-if="date" class="clock-date text-medium-emphasis">{{ date }}</div>
      </div>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import FormatPanel from "@/components/FormatPanel.vue";
import UserData from "@/helpers/UserData";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import { useModuleProjection } from "@/composables/useModuleProjection";
import { useModuleFormat } from "@/composables/useModuleFormat";

const { fmt, restoreFormat, show_format } = useModuleFormat("clock", manifest);

const projection = useModuleProjection("clock", {
  onAction(action) {
    if (action === "toggle_24h") toggle24h();
    else if (action === "toggle_seconds") toggleSeconds();
    else if (action === "toggle_format") show_format.value = !show_format.value;
    else if (action === "restore") restoreFormat();
  },
});

const moduleContainer = ref(null);
const time = ref("");
const date = ref("");
let timer = null;

const t = (key) => moduleContainer.value?.t(key) || key;

const DATE_FORMATS = {
  long: { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
  medium: { day: "2-digit", month: "long", year: "numeric" },
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  weekday: { weekday: "long", day: "2-digit", month: "long" },
  month_year: { month: "long", year: "numeric" },
  weekday_only: { weekday: "long" },
};

// Lê configs do UserData (escritas pelo FormatPanel ou pelas actions da ribbon).
function read() {
  return {
    is24h: (fmt.hour_cycle ?? "24h") === "24h",
    showSeconds: (fmt.time_format ?? "hh:mm:ss") === "hh:mm:ss",
    showDate: fmt.show_date !== false,
    dateFormat: fmt.date_format ?? "long",
  };
}

function formatTime(now) {
  const { is24h, showSeconds } = read();
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    hour12: !is24h,
  });
}

function formatDate(now) {
  const { showDate, dateFormat } = read();
  if (!showDate) return "";
  const opts = DATE_FORMATS[dateFormat] || DATE_FORMATS.long;
  return now.toLocaleDateString([], opts);
}

// Quando user muda qualquer config do clock (FormatPanel ou ribbon),
// refaz tick imediatamente sem esperar 1s.
useBroadcastListener(BROADCAST_TYPE.MODULE_FORMAT_CHANGED, (payload) => {
  if (payload?.module === "clock") tick();
});

function tick() {
  const now = new Date();
  time.value = formatTime(now);
  date.value = formatDate(now);
  projection.emit({ text: time.value, reference: date.value, active: true });
}

function toggle24h() {
  fmt.hour_cycle = (fmt.hour_cycle ?? "24h") === "24h" ? "12h" : "24h";
  tick();
}

function toggleSeconds() {
  fmt.time_format = (fmt.time_format ?? "hh:mm:ss") === "hh:mm:ss" ? "hh:mm" : "hh:mm:ss";
  tick();
}

function openFullscreen() {
  const { is24h, showSeconds } = read();
  const params = new URLSearchParams({
    h24: is24h ? "1" : "0",
    sec: showSeconds ? "1" : "0",
  });
  window.open(`/clock?${params}`, "_blank", "noopener,noreferrer,width=800,height=400");
}

function close() {
  clearInterval(timer);
}

onMounted(() => {
  // Migração one-shot: se houver chaves antigas show24h/showSeconds, copia para
  // hour_cycle/time_format e remove as legadas.
  const legacy24h = UserData.get("modules.clock.show24h", null);
  const legacySec = UserData.get("modules.clock.showSeconds", null);
  if (legacy24h !== null && fmt.hour_cycle == null) {
    fmt.hour_cycle = legacy24h ? "24h" : "12h";
    UserData.set("modules.clock.show24h", null);
  }
  if (legacySec !== null && fmt.time_format == null) {
    fmt.time_format = legacySec ? "hh:mm:ss" : "hh:mm";
    UserData.set("modules.clock.showSeconds", null);
  }

  tick();
  timer = setInterval(tick, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.clock-time {
  font-size: 3rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums;
}
.clock-date {
  font-size: 0.9rem;
  text-transform: capitalize;
}

.format-col {
  flex: 0 0 200px;
  width: 200px;
  border-right: 1px solid var(--lj-surface-border);
  background: var(--lj-surface-bg);
  height: 100%;
}
</style>
