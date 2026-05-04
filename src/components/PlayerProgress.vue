<template>
  <div class="d-flex align-center justify-center py-1 px-3">
    <div class="text-right text-caption">
      {{ shortTime(currentTime) }}
    </div>
    <div class="flex-grow-1 px-2">
      <v-progress-linear
        :model-value="progress"
        rounded
        clickable
        :indeterminate="loading"
        :height="10"
        :buffer-value="buffered"
        :color="progressColor"
        @click="$emit('seek')"
      />
    </div>
    <div class="text-left text-caption">
      {{ shortTime(duration) }}
    </div>
    <div
      v-if="lastSlide > 0"
      class="text-caption text-medium-emphasis ml-2"
      style="white-space: nowrap"
    >
      {{ slideIndex + 1 }}/{{ lastSlide }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import DateTime from "@/helpers/DateTime";

const props = defineProps({
  progress: { type: Number, default: 0 },
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  buffered: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  volume: { type: Number, default: 100 },
  slideIndex: { type: Number, default: 0 },
  lastSlide: { type: Number, default: 0 },
});

defineEmits(["seek"]);

const progressColor = computed(() => {
  if (props.isPaused) return "warning";
  if (props.volume <= 0) return "red";
  return "info";
});

const shortTime = (t) => DateTime.shortTime(t);
</script>
