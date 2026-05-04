<template>
  <Screen :config="bibleConfig" />
</template>

<script setup>
import { computed } from "vue";
import AppData from "@/helpers/AppData";
import Screen from "../components/Screen.vue";

const bibleConfig = computed(() => {
  const savedConfig = AppData.get("modules.bible.config");
  return (
    savedConfig || {
      background: "#000000",
      textColor: "#ffffff",
      referenceColor: "#aaaaaa",
      textFontSize: 48,
      referenceFontSize: 32,
      fontFamily: "Arial, sans-serif",
    }
  );
});
</script>
