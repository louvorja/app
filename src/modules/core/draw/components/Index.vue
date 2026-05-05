<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '340px' }"
    @close="close()"
  >
    <template #right>
      <v-btn
        icon="mdi-fullscreen"
        variant="text"
        density="compact"
        :title="t('actions.fullscreen')"
        @click="fullscreen = true"
      />
    </template>

    <!-- Config -->
    <div class="d-flex align-center pa-3" style="gap: 12px">
      <v-text-field
        v-model.number="min"
        type="number"
        :label="t('inputs.min')"
        density="compact"
        hide-details
        style="flex: 1"
        :disabled="drawn.length > 0"
      />
      <v-text-field
        v-model.number="max"
        type="number"
        :label="t('inputs.max')"
        density="compact"
        hide-details
        style="flex: 1"
        :disabled="drawn.length > 0"
      />
    </div>

    <!-- Display do número sorteado -->
    <div class="d-flex flex-column align-center py-4" style="gap: 8px">
      <div class="draw-number" :class="{ 'draw-animating': animating }">
        {{ current ?? "—" }}
      </div>
      <div class="text-caption text-medium-emphasis">
        {{ t("data.remaining") }}: {{ remaining }} / {{ total }}
      </div>
    </div>

    <!-- Botões -->
    <div class="d-flex justify-center pa-3" style="gap: 8px">
      <v-btn
        :color="primaryColor"
        :disabled="remaining === 0"
        prepend-icon="mdi-dice-5"
        @click="drawNumber"
      >
        {{ t("actions.draw") }}
      </v-btn>
      <v-btn variant="tonal" prepend-icon="mdi-restart" @click="reset">
        {{ t("actions.reset") }}
      </v-btn>
    </div>

    <!-- Histórico -->
    <v-divider v-if="drawn.length" />
    <div v-if="drawn.length" class="pa-3">
      <div class="text-caption text-medium-emphasis mb-2">{{ t("data.drawn") }}:</div>
      <div class="d-flex flex-wrap" style="gap: 6px">
        <v-chip v-for="n in drawn" :key="n" size="small" variant="tonal">{{ n }}</v-chip>
      </div>
    </div>
  </ModuleContainer>

  <!-- Fullscreen overlay -->
  <v-dialog v-model="fullscreen" fullscreen transition="fade-transition">
    <div
      ref="fsRoot"
      class="draw-fs-root"
      tabindex="0"
      @keydown.space.prevent="drawNumber"
      @keydown.esc="fullscreen = false"
    >
      <div class="draw-fs-number" :class="{ 'draw-animating': animating }">
        {{ current ?? "—" }}
      </div>
      <div class="draw-fs-remaining">{{ remaining }} / {{ total }}</div>
      <div class="draw-fs-actions">
        <v-btn
          :color="primaryColor"
          :disabled="remaining === 0"
          size="large"
          prepend-icon="mdi-dice-5"
          @click="drawNumber"
        >
          {{ t("actions.draw") }}
        </v-btn>
        <v-btn variant="tonal" size="large" prepend-icon="mdi-restart" @click="reset">
          {{ t("actions.reset") }}
        </v-btn>
        <v-btn
          icon="mdi-fullscreen-exit"
          variant="text"
          size="large"
          color="white"
          @click="fullscreen = false"
        />
      </div>
      <div v-if="drawn.length" class="draw-fs-history">
        <v-chip v-for="n in drawn" :key="n" size="small" variant="tonal" color="white">
          {{ n }}
        </v-chip>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import AppData from "@/helpers/AppData";

const moduleContainer = ref(null);
const fsRoot = ref(null);
const min = ref(1);
const max = ref(100);
const current = ref(null);
const drawn = ref([]);
const animating = ref(false);
const fullscreen = ref(false);

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));
const total = computed(() => Math.max(0, max.value - min.value + 1));
const remaining = computed(() => total.value - drawn.value.length);
const pool = computed(() => {
  const all = [];
  for (let i = min.value; i <= max.value; i++) {
    if (!drawn.value.includes(i)) all.push(i);
  }
  return all;
});

const t = (key) => moduleContainer.value?.t(key) || key;

watch(fullscreen, (val) => {
  if (val) nextTick(() => fsRoot.value?.focus());
});

function drawNumber() {
  if (!pool.value.length) return;
  animating.value = true;
  const n = pool.value[Math.floor(Math.random() * pool.value.length)];
  drawn.value.push(n);
  current.value = n;
  setTimeout(() => {
    animating.value = false;
  }, 400);
}

function reset() {
  drawn.value = [];
  current.value = null;
}

function close() {
  reset();
}
</script>

<style scoped>
.draw-number {
  font-size: 5rem;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  min-width: 3ch;
  text-align: center;
  transition:
    transform 0.2s,
    opacity 0.2s;
}
.draw-animating {
  transform: scale(1.15);
  opacity: 0.7;
}

/* Fullscreen */
.draw-fs-root {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  outline: none;
  cursor: default;
}
.draw-fs-number {
  font-size: clamp(6rem, 30vw, 20rem);
  font-weight: 100;
  font-variant-numeric: tabular-nums;
  color: #fff;
  line-height: 1;
  transition:
    transform 0.25s,
    opacity 0.25s;
}
.draw-fs-remaining {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}
.draw-fs-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.draw-fs-history {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 80vw;
  padding: 0 24px;
}
</style>
