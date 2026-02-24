<template>
  <div
    ref="container"
    class="stopwatch-screen"
    :style="{
      background: config.background,
      width: '100%',
      height: height ? height + 'px' : '100%',
      color: shouldShowNegativeColor ? (config.negativeColor || '#ef4444') : config.textColor,
    }"
  >
    <!-- Current Time Display -->
    <div 
      v-if="config.showCurrentTime" 
      class="current-time"
      :style="{ 
        fontSize: (config.currentTimeFontSize || 18) + 'px',
        color: config.currentTimeColor || '#6b7280'
      }"
    >
      {{ formattedCurrentTime }}
    </div>
    
    <!-- Main Timer Display -->
    <span 
      class="timer-display"
      :class="{ 'negative': shouldShowNegativeColor }"
      :style="{ 
        fontSize: config.fontSize ? config.fontSize + 'px' : '96px',
        fontFamily: config.fontFamily || 'Arial, sans-serif'
      }"
    >
      {{ formattedTime }}
    </span>
    
    <!-- Target Reached Indicator -->
    <div 
      v-if="targetReached" 
      class="target-reached"
      :style="{ fontSize: (config.fontSize * 0.15) + 'px' }"
    >
      {{ targetReachedText }}
    </div>
  </div>
</template>

<script>
export default {
  name: "StopwatchPage",
  props: {
    height: Number,
    config: {
      type: Object,
      default: () => ({
        background: '#000',
        textColor: '#fff',
        negativeColor: '#ef4444',
        currentTimeColor: '#6b7280',
        currentTimeFontSize: 18,
        fontSize: 96,
        fontFamily: 'Arial, sans-serif',
        showCurrentTime: true,
        currentTime: 0,
      })
    },
  },
  data: () => ({
    s_width: 0,
    s_height: 0,
    currentTime: new Date(),
    timer: null,
  }),
  computed: {
    // Returns true if current time is negative OR if target was reached
    shouldShowNegativeColor() {
      // If negative time (below zero)
      if (this.config.currentTime < 0) {
        return true;
      }
      // If target was reached in countup mode
      if (this.targetReached) {
        return true;
      }
      return false;
    },
    targetReached() {
      // Check if target time was reached based on countup mode
      if (this.config.mode === 'countup' && this.config.targetHours !== undefined) {
        const targetMs = (this.config.targetHours * 3600000) + 
                        (this.config.targetMinutes * 60000) + 
                        (this.config.targetSeconds * 1000);
        return this.config.currentTime >= targetMs;
      }
      return false;
    },
    formattedCurrentTime() {
      return this.currentTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    targetReachedText() {
      return '✓ Alvo alcançado';
    },
    formattedTime() {
      const time = this.config.currentTime || 0;
      const absTime = Math.abs(time);
      const hours = Math.floor(absTime / 3600000);
      const minutes = Math.floor((absTime % 3600000) / 60000);
      const seconds = Math.floor((absTime % 60000) / 1000);
      
      const sign = time < 0 ? '-' : '';
      
      if (hours > 0) {
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
  },
  methods: {
    fontSizePc(pc) {
      const v = Math.min(this.s_width, this.s_height);
      return (pc * v) / 100 / 2;
    },
    windowResize() {
      const container = this.$refs.container;
      if (container) {
        this.s_width = container.offsetWidth;
        this.s_height = container.offsetHeight;

        if (this.width <= 0 || this.height <= 0) {
          const self = this;
          setTimeout(function () {
            self.windowResize();
          }, 100);
        }
      }
    },
    updateCurrentTime() {
      this.currentTime = new Date();
    },
  },
  mounted() {
    this.windowResize();
    window.addEventListener("resize", this.windowResize);
    
    // Update current time every second
    this.timer = setInterval(this.updateCurrentTime, 1000);
  },
  unmounted() {
    window.removeEventListener("resize", this.windowResize);
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
};
</script>

<style scoped>
.stopwatch-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.current-time {
  opacity: 0.7;
  margin-bottom: 10px;
  font-weight: 400;
}

.timer-display {
  font-weight: 600;
  text-align: center;
}

.timer-display.negative {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.target-reached {
  margin-top: 20px;
  color: #10b981;
  font-weight: 500;
}
</style>

