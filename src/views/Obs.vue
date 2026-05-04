<template>
  <div class="obs-root">
    <div
      v-if="slide?.url_image"
      class="obs-bg"
      :style="{ backgroundImage: `url(${slide.url_image})` }"
    />
    <div class="obs-content">
      <div v-if="slide" class="obs-text" v-html="slide.lyric || slide.name || ''" />
    </div>
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
</style>
