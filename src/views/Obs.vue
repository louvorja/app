<template>
  <div class="obs-root">
    <!--
      Fade-in só ao APARECER (música começa) e fade-out ao SUMIR (música
      fecha). Trocas de slide trocam conteúdo dentro do mesmo nó, sem
      acionar o Transition — assim a leitura não fica piscando a cada
      verso. O elemento controlado é a `obs-stage` inteira, com `v-if`
      derivado de `slide`.
    -->
    <Transition name="obs-fade">
      <div v-if="slide" class="obs-stage">
        <div
          v-if="slide.url_image"
          class="obs-bg"
          :style="{ backgroundImage: `url(${slide.url_image})` }"
        />
        <div class="obs-content">
          <div class="obs-text" v-html="slide.lyric || slide.name || ''" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useProjectionState } from "@/composables/useProjectionState";

const { slide } = useProjectionState();

onMounted(() => {
  document.body.style.margin = "0";
  document.body.style.background = "transparent";
});
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: sans-serif;
}
</style>
<style scoped>
.obs-root {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: transparent;
}
.obs-stage {
  position: absolute;
  inset: 0;
}
.obs-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.4;
}
.obs-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}
.obs-text {
  color: #fff;
  font-size: 52px;
  font-weight: 300;
  text-align: center;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
  line-height: 1.4;
}

/* Fade-in ao aparecer / fade-out ao desaparecer. Saída um pouco mais
   longa para a transmissão "respirar" entre músicas. */
.obs-fade-enter-active {
  transition: opacity 0.5s ease-out;
}
.obs-fade-leave-active {
  transition: opacity 0.7s ease-in;
}
.obs-fade-enter-from,
.obs-fade-leave-to {
  opacity: 0;
}
</style>
