<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    Módulo Base
  </ModuleContainer>
</template>

<script setup>
/* ########################################################### */
/* ####### INSTALAÇÃO DO MODULO ############################## */
/* ########################################################### */
defineOptions({ name: "BaseModuleIndex" });
import { ref } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
const moduleContainer = ref(null);
/* ########################################################### */
/* ########################################################### */
/* ########################################################### */
</script>
