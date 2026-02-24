<template>
  <div class="preview-panel">
    <!-- Título -->
    <div class="section-title">
      <span>{{ $t('modules.clock.settings.preview') }}</span>
    </div>

    <!-- Relógio -->
    <div
      class="clock-display"
      :style="{
        backgroundColor: config.background,
        color: config.textColor
      }"
    >
      <span class="clock-time">{{ formattedTime }}</span>
    </div>

    <!-- Data -->
    <div class="date-display">
      {{ formattedDate }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
});

const currentTime = ref(new Date());
let timer = null;

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

const formattedTime = computed(() => {
  const options = {};
  
  if (props.config.format.includes('hh')) {
    options.hour = '2-digit';
  }
  if (props.config.format.includes('mm')) {
    options.minute = '2-digit';
  }
  if (props.config.format.includes('ss')) {
    options.second = '2-digit';
  }
  
  return currentTime.value.toLocaleTimeString('pt-BR', options);
});

const formattedDate = computed(() => {
  return currentTime.value.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});
</script>

<style scoped>
.preview-panel {
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 450px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.clock-display {
  height: 180px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  font-weight: 600;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.date-display {
  background: #f3f4f6;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  text-transform: capitalize;
}
</style>
