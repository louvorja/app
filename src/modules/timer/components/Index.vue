<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '300px' }"
    @close="close()"
  >
    <div class="d-flex h-100">
      <aside v-if="show_format" class="format-col">
        <FormatPanel :module-id="'timer'" :manifest="manifest" />
      </aside>
      <div class="d-flex flex-column align-center pa-4 flex-grow-1" style="gap: 16px">
        <!-- Seletor de modo -->
        <v-btn-toggle v-model="mode" mandatory density="compact" divided>
          <v-btn value="up" size="small">{{ t("mode.up") }}</v-btn>
          <v-btn value="down" size="small">{{ t("mode.down") }}</v-btn>
        </v-btn-toggle>

        <!-- Horário base/alvo -->
        <div v-if="!running" class="d-flex align-center" style="gap: 8px">
          <v-text-field
            v-model="targetTime"
            type="time"
            density="compact"
            hide-details
            style="width: 140px"
            :label="t('actions.set')"
            @change="updateFromTargetTime"
          />
        </div>

        <!-- Display -->
        <div
          class="sw-display"
          :class="{
            'sw-warning': mode === 'down' && seconds <= 60 && seconds > 0,
            'sw-done': mode === 'down' && seconds <= 0 && alarmed,
          }"
        >
          {{ display }}
        </div>
        <div class="sw-display">
          {{ targetTime }}
        </div>

        <!-- Controles -->
        <div class="d-flex" style="gap: 8px">
          <v-btn :icon="running ? 'mdi-pause' : 'mdi-play'" :color="primaryColor" @click="toggle" />
          <v-btn icon="mdi-restart" variant="tonal" @click="reset" />
        </div>

        <!-- Mensagem de alarme -->
        <v-chip v-if="alarmed" color="error" variant="tonal" prepend-icon="mdi-alarm">
          {{ t("alarm.done") }}
        </v-chip>
      </div>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import FormatPanel from "@/components/FormatPanel.vue";
import { playBeep } from "@helpers/AudioBeep";
import AppData from "@/helpers/AppData";
import { useModuleProjection } from "@/composables/useModuleProjection";
import { useModuleFormat } from "@/composables/useModuleFormat";

const { restoreFormat, show_format } = useModuleFormat("timer", manifest);

const projection = useModuleProjection("timer", {
  onAction(action) {
    if (action === "toggle") toggle();
    else if (action === "reset") reset();
    else if (action === "toggle_format") show_format.value = !show_format.value;
    else if (action === "restore") restoreFormat();
  },
});

function playAlarm() {
  try {
    playBeep(880, 0.25, 0.5, 0);
    playBeep(880, 0.25, 0.5, 0.3);
    playBeep(1100, 0.4, 0.5, 0.6);
  } catch {
    /* noop */
  }
}

const moduleContainer = ref(null);
const mode = ref("up");
const running = ref(false);
const seconds = ref(0);
const targetTime = ref(getCurrentTimeValue());
const durationSeconds = ref(0);
const startedAt = ref(null);
const alarmed = ref(false);
let timer = null;

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

const display = computed(() => {
  const abs = Math.abs(seconds.value);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const sign = seconds.value < 0 ? "-" : "";

  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});
const projecao = computed(() => {
  return `${display.value} \n ${targetTime.value}`;
});
const t = (key) => moduleContainer.value?.t(key) || key;

watch(mode, () => reset());

watch(
  projecao,
  (val) => {
    projection.emit({ text: val, active: true });
  },
  { immediate: true }
);

function getCurrentTimeValue() {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getTargetDate() {
  const [hours, minutes] = targetTime.value.split(":").map(Number);
  const target = new Date();

  target.setHours(hours || 0, minutes || 0, 0, 0);

  return target;
}

function getDurationUntilTarget() {
  const now = new Date();
  const target = getTargetDate();

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
}

function updateFromTargetTime() {
  alarmed.value = false;
  durationSeconds.value = getDurationUntilTarget();
  seconds.value = mode.value === "down" ? durationSeconds.value : 0;
}

function updateRunningTime() {
  if (!startedAt.value) return;

  const elapsedSeconds = Math.floor((Date.now() - startedAt.value) / 1000);

  if (mode.value === "up") {
    seconds.value = Math.min(elapsedSeconds, durationSeconds.value);

    if (seconds.value >= durationSeconds.value && !alarmed.value) {
      alarmed.value = true;
      pause();
      playAlarm();
    }

    return;
  }

  seconds.value = Math.max(durationSeconds.value - elapsedSeconds, 0);

  if (seconds.value <= 0 && !alarmed.value) {
    alarmed.value = true;
    pause();
    playAlarm();
  }
}

function toggle() {
  if (running.value) {
    pause();
  } else {
    start();
  }
}

function start() {
  alarmed.value = false;
  durationSeconds.value = getDurationUntilTarget();
  startedAt.value = Date.now();
  seconds.value = mode.value === "down" ? durationSeconds.value : 0;
  running.value = true;

  timer = setInterval(updateRunningTime, 1000);
}

function pause() {
  running.value = false;
  clearInterval(timer);
}

function reset() {
  pause();
  startedAt.value = null;
  alarmed.value = false;
  updateFromTargetTime();
}

function close() {
  pause();
}

onBeforeUnmount(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.sw-display {
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
  white-space: pre-line;
}
.sw-warning {
  color: #f59e0b;
}
.sw-done {
  color: #ef4444;
  animation: sw-pulse 0.8s ease-in-out infinite alternate;
}
.format-col {
  flex: 0 0 200px;
  width: 200px;
  border-right: 1px solid var(--lj-surface-border);
  background: var(--lj-surface-bg);
  height: 100%;
}
@keyframes sw-pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.35;
  }
}
</style>
