<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    Módulo Base
  </ModuleContainer>
</template>

<script setup>
/* ########################################################### */
/* ####### INSTALAÇÃO DO MODULO ############################## */
/* ########################################################### */
import { ref, computed } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
const userdata = computed(() => {
  return moduleContainer.value?.userdata;
});
const appdata = computed(() => {
  return moduleContainer.value?.appdata;
});
/* ########################################################### */
/* ########################################################### */
/* ########################################################### */
</script>
