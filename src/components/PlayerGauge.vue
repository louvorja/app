<template>
  <div class="d-flex align-center justify-center pa-1">
    <div>
      <v-btn
        :disabled="loading"
        :icon="icon"
        size="x-small"
        variant="text"
        @click="$emit('toggle')"
      />
    </div>
    <div class="flex-grow-1 px-2" style="min-width: 100px">
      <v-progress-linear
        :model-value="volume"
        rounded
        clickable
        :height="10"
        color="white"
        @update:model-value="$emit('seek', $event)"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  volume: { type: Number, default: 100 },
  icon: { type: String, default: "mdi-volume-high" },
  loading: { type: Boolean, default: false },
});

defineEmits(["toggle", "seek"]);
</script>
