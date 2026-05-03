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

<script>
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";

export default {
  name: "ClockModule",
  components: { ModuleContainer },
  data: () => ({ manifest, time: "", date: "", timer: null, show24h: true, showSeconds: true }),
  mounted() {
    this.show24h = this.$userdata.get("modules.clock.show24h", true);
    this.showSeconds = this.$userdata.get("modules.clock.showSeconds", true);
    this.tick();
    this.timer = setInterval(this.tick, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    t(key) {
      return this.$refs.moduleContainer?.t(key) || key;
    },
    tick() {
      const now = new Date();
      this.time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        ...(this.showSeconds ? { second: "2-digit" } : {}),
        hour12: !this.show24h,
      });
      this.date = now.toLocaleDateString([], {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    },
    toggle24h() {
      this.show24h = !this.show24h;
      this.$userdata.set("modules.clock.show24h", this.show24h);
      this.tick();
    },
    toggleSeconds() {
      this.showSeconds = !this.showSeconds;
      this.$userdata.set("modules.clock.showSeconds", this.showSeconds);
      this.tick();
    },
    openFullscreen() {
      const params = new URLSearchParams({
        h24: this.show24h ? "1" : "0",
        sec: this.showSeconds ? "1" : "0",
      });
      window.open(`/clock?${params}`, "_blank", "noopener,noreferrer,width=800,height=400");
    },
    close() {
      clearInterval(this.timer);
    },
  },
};
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
