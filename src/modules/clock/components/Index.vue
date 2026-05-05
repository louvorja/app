<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '280px' }"
    @close="close()"
  >
    <template #right>
      <v-btn
        :icon="show24h ? 'mdi-hours-24' : 'mdi-clock-outline'"
        variant="text"
        density="compact"
        :title="t('actions.toggle_format')"
        @click="toggle24h"
      />
      <v-btn
        :icon="showSeconds ? 'mdi-timer-outline' : 'mdi-timer-off-outline'"
        variant="text"
        density="compact"
        :title="t('actions.toggle_seconds')"
        @click="toggleSeconds"
      />
      <v-btn
        icon="mdi-fullscreen"
        variant="text"
        density="compact"
        :title="t('actions.fullscreen')"
        @click="openFullscreen"
      />
    </template>

    <div class="d-flex flex-column align-center justify-center pa-6" style="gap: 4px">
      <div class="clock-time">{{ time }}</div>
      <div class="clock-date text-medium-emphasis">{{ date }}</div>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import UserData from "@/helpers/UserData";

const moduleContainer = ref(null);
const time = ref("");
const date = ref("");
const show24h = ref(true);
const showSeconds = ref(true);
let timer = null;

const t = (key) => moduleContainer.value?.t(key) || key;

function tick() {
  const now = new Date();
  time.value = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds.value ? { second: "2-digit" } : {}),
    hour12: !show24h.value,
  });
  date.value = now.toLocaleDateString([], {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toggle24h() {
  show24h.value = !show24h.value;
  UserData.set("modules.clock.show24h", show24h.value);
  tick();
}

function toggleSeconds() {
  showSeconds.value = !showSeconds.value;
  UserData.set("modules.clock.showSeconds", showSeconds.value);
  tick();
}

function openFullscreen() {
  const params = new URLSearchParams({
    h24: show24h.value ? "1" : "0",
    sec: showSeconds.value ? "1" : "0",
  });
  window.open(`/clock?${params}`, "_blank", "noopener,noreferrer,width=800,height=400");
}

function close() {
  clearInterval(timer);
}

onMounted(() => {
  show24h.value = UserData.get("modules.clock.show24h", true);
  showSeconds.value = UserData.get("modules.clock.showSeconds", true);
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
</style>
