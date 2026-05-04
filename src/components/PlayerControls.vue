<template>
  <div class="d-flex align-center justify-center py-1 flex-grow-1">
    <v-btn
      v-for="(button, key) in buttons"
      v-show="button.show && (compact === false || (compact === true && !button.compact))"
      :key="key"
      :disabled="loading || button.disabled"
      :icon="button.icon"
      :color="button.highlight ? 'white' : ''"
      :variant="button.highlight ? 'flat' : 'text'"
      class="ma-1"
      size="small"
      @click="button.click"
    />
  </div>
</template>

<script setup>
defineProps({
  buttons: { type: Array, required: true },
  compact: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
});
</script>
