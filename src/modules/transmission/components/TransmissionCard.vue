<template>
  <v-card variant="outlined" class="pa-3">
    <div class="d-flex align-center" style="gap: 12px">
      <v-icon :icon="icon" size="28" />
      <div style="flex: 1; min-width: 0">
        <div class="font-weight-medium text-body-2">{{ title }}</div>
        <div class="text-caption text-medium-emphasis">{{ hint }}</div>
        <div class="text-caption text-disabled mt-1" style="word-break: break-all">{{ url }}</div>
      </div>
    </div>

    <!-- Seletor de monitor — apenas no Electron com múltiplos monitors -->
    <div v-if="isDesktop && monitors && monitors.length > 1" class="mt-2">
      <v-select
        :model-value="selectedMonitor"
        :items="monitors"
        item-title="label"
        item-value="id"
        density="compact"
        variant="outlined"
        hide-details
        prepend-inner-icon="mdi-monitor"
        @update:model-value="(id) => emit('set-monitor', id)"
      />
    </div>

    <div class="d-flex mt-2" style="gap: 8px">
      <v-btn size="small" :color="color" prepend-icon="mdi-open-in-new" @click="emit('open')">
        {{ btnOpen }}
      </v-btn>
      <v-btn
        size="small"
        variant="tonal"
        :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        @click="copy"
      >
        {{ copied ? btnCopied : btnCopy }}
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  icon: String,
  title: String,
  hint: String,
  url: String,
  btnOpen: String,
  btnCopy: String,
  btnCopied: String,
  color: { type: String, default: null },
  monitors: { type: Array, default: () => [] },
  selectedMonitor: { type: Number, default: null },
  isDesktop: { type: Boolean, default: false },
});

const emit = defineEmits(["open", "set-monitor"]);

const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    /* noop */
  }
}
</script>
