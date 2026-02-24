<template>
  <div class="popup-container" :style="{ background: stopwatchConfig.background }">
    <!-- Timer Display -->
    <Screen :config="stopwatchConfig" :height="null" />
  </div>
</template>

<script>
import manifest from "../manifest.json";
import Screen from "../components/Screen.vue";

export default {
  name: "PopupStopwatchPage",
  components: {
    Screen,
  },
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
    
    stopwatchConfig() {
      const savedConfig = this.$appdata.get(`modules.stopwatch.config`);
      return savedConfig || {
        background: '#000000',
        textColor: '#ffffff',
        negativeColor: '#ef4444',
        currentTimeColor: '#6b7280',
        currentTimeFontSize: 18,
        fontSize: 96,
        fontFamily: 'Arial, sans-serif',
        showCurrentTime: true,
        currentTime: 0,
      };
    },
  },
};
</script>

<style scoped>
.popup-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

