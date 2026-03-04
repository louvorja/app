<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template #header>
      <!-- Your header content -->
    </template>

    <!-- Your main content -->
    <h1>{{ t("title") }} | Clock With Anime.js</h1>
    <button @click="openShowAnimation = !openShowAnimation">
      Show Animation
    </button>
    <br />
    <button @click="openEditAnimation = !openEditAnimation">
      Edit Animation
    </button>

    <ShowAnimation v-if="openShowAnimation" />
    <EditAnimation v-if="openEditAnimation" />
  </ModuleContainer>
</template>

<script setup>
import ModuleContainer from "@/components/ModuleContainer.vue";
import { ref, watch } from "vue";
import manifest from "../manifest.json";
import ShowAnimation from "./components/modals/ShowAnimation.vue";
import EditAnimation from "./components/modals/EditAnimation.vue";

// ---- Obrigatório para tradução -------
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};

// ---------------------------------------

const openShowAnimation = ref(false);
const openEditAnimation = ref(false);

// Watcher open (Only one modal can be open at a time, if one is open, the other is closed)

watch(openShowAnimation, (value) => {
  if (value) {
    openEditAnimation.value = false;
  }
});

watch(openEditAnimation, (value) => {
  if (value) {
    openShowAnimation.value = false;
  }
});
</script>
