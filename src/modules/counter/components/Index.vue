<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '260px' }"
    @close="close()"
  >
    <div class="d-flex flex-column align-center pa-6" style="gap: 16px">
      <div class="counter-display">{{ count }}</div>
      <div class="d-flex" style="gap: 8px">
        <v-btn icon="mdi-minus" size="large" variant="tonal" @click="decrement" />
        <v-btn icon="mdi-plus" size="large" :color="primaryColor" @click="increment" />
      </div>
      <v-btn size="small" variant="text" @click="reset">{{ t("actions.reset") }}</v-btn>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import AppData from "@/helpers/AppData";

const moduleContainer = ref(null);
const count = ref(0);

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

const t = (key) => moduleContainer.value?.t(key) || key;

function increment() {
  count.value++;
}
function decrement() {
  count.value--;
}
function reset() {
  count.value = 0;
}
function close() {
  count.value = 0;
}
</script>

<style scoped>
.counter-display {
  font-size: 5rem;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  min-width: 3ch;
  text-align: center;
}
</style>
