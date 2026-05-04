<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '340px' }"
    @close="close()"
  >
    <template #right>
      <v-btn
        :icon="showList ? 'mdi-dice-5' : 'mdi-format-list-bulleted'"
        variant="text"
        density="compact"
        @click="showList = !showList"
      />
      <v-btn
        icon="mdi-fullscreen"
        variant="text"
        density="compact"
        :title="t('actions.fullscreen')"
        @click="openFullscreen"
      />
    </template>

    <!-- Modo lista para editar nomes -->
    <div v-if="showList" class="pa-3">
      <v-textarea
        v-model="namesText"
        :placeholder="t('inputs.names')"
        rows="8"
        auto-grow
        density="compact"
        hide-details
        variant="outlined"
      />
      <v-btn class="mt-2" size="small" :color="primaryColor" @click="applyList">
        {{ t("actions.apply") }}
      </v-btn>
    </div>

    <!-- Modo sorteio -->
    <div v-else class="d-flex flex-column align-center py-4" style="gap: 8px">
      <div class="name-display" :class="{ 'name-animating': animating }">
        {{ current || "—" }}
      </div>
      <div class="text-caption text-medium-emphasis">
        {{ t("data.remaining") }}: {{ pool.length }} / {{ names.length }}
      </div>
      <div class="d-flex" style="gap: 8px">
        <v-btn
          :color="primaryColor"
          :disabled="!pool.length"
          prepend-icon="mdi-shuffle"
          @click="drawName"
        >
          {{ t("actions.draw") }}
        </v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-restart" @click="reset">
          {{ t("actions.reset") }}
        </v-btn>
      </div>
      <div v-if="drawn.length" class="w-100 px-3">
        <v-divider class="mb-2" />
        <div class="text-caption text-medium-emphasis mb-1">{{ t("data.drawn") }}:</div>
        <div class="d-flex flex-wrap" style="gap: 4px">
          <v-chip v-for="n in drawn" :key="n" size="x-small" variant="tonal">{{ n }}</v-chip>
        </div>
      </div>
    </div>
  </ModuleContainer>

  <!-- Fullscreen overlay -->
  <v-dialog v-model="fullscreen" fullscreen transition="fade-transition">
    <div
      ref="fsRoot"
      class="ndraw-fs-root"
      tabindex="0"
      @keydown.space.prevent="drawName"
      @keydown.esc="fullscreen = false"
    >
      <div class="ndraw-fs-name" :class="{ 'name-animating': animating }">{{ current || "—" }}</div>
      <div class="ndraw-fs-remaining">{{ pool.length }} / {{ names.length }}</div>
      <div class="ndraw-fs-actions">
        <v-btn
          :color="primaryColor"
          :disabled="!pool.length"
          size="large"
          prepend-icon="mdi-shuffle"
          @click="drawName"
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
      <div v-if="drawn.length" class="ndraw-fs-history">
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
const showList = ref(true);
const namesText = ref("");
const names = ref([]);
const drawn = ref([]);
const current = ref(null);
const animating = ref(false);
const fullscreen = ref(false);

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));
const pool = computed(() => names.value.filter((n) => !drawn.value.includes(n)));

const t = (key) => moduleContainer.value?.t(key) || key;

watch(fullscreen, (val) => {
  if (val) nextTick(() => fsRoot.value?.focus());
});

function applyList() {
  names.value = namesText.value
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  drawn.value = [];
  current.value = null;
  showList.value = false;
}

function drawName() {
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

function openFullscreen() {
  if (!showList.value && !names.value.length) return;
  if (showList.value) applyList();
  fullscreen.value = true;
}

function close() {
  reset();
}
</script>

<style scoped>
.name-display {
  font-size: 2.5rem;
  font-weight: 300;
  text-align: center;
  max-width: 320px;
  word-break: break-word;
  transition:
    transform 0.2s,
    opacity 0.2s;
}
.name-animating {
  transform: scale(1.08);
  opacity: 0.7;
}

/* Fullscreen */
.ndraw-fs-root {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  outline: none;
}
.ndraw-fs-name {
  font-size: clamp(3rem, 15vw, 10rem);
  font-weight: 100;
  color: #fff;
  text-align: center;
  max-width: 90vw;
  word-break: break-word;
  line-height: 1.15;
  transition:
    transform 0.25s,
    opacity 0.25s;
}
.ndraw-fs-remaining {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.4);
}
.ndraw-fs-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ndraw-fs-history {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 80vw;
  padding: 0 24px;
}
</style>
