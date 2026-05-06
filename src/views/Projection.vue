<template>
  <Slide :slide="slide" :title="title" :progress="progress" show-progress class="projection-fill" />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { useProjectionState } from "@/composables/useProjectionState";
import $broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import Slide from "@/components/Slide.vue";

const { slide, progress, title, slideIndex, totalSlides } = useProjectionState();

function _goTo(index) {
  if (totalSlides.value <= 0) return;
  const clamped = Math.max(0, Math.min(totalSlides.value - 1, index));
  $broadcast.send(BROADCAST_TYPE.GO_TO_SLIDE, { index: clamped });
}

function _onKey(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    setTimeout(() => window.close(), 200);
  } else if (
    e.key === "ArrowRight" ||
    e.key === "ArrowDown" ||
    e.key === "PageDown" ||
    e.key === " "
  ) {
    e.preventDefault();
    _goTo(slideIndex.value + 1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    _goTo(slideIndex.value - 1);
  } else if (e.key === "Home") {
    e.preventDefault();
    _goTo(0);
  } else if (e.key === "End") {
    e.preventDefault();
    _goTo(totalSlides.value - 1);
  }
}

onMounted(() => {
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#000";
  window.addEventListener("keydown", _onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", _onKey);
});
</script>

<style scoped>
.projection-fill {
  width: 100vw;
  height: 100vh;
}
.projection-fill,
.projection-fill :deep(*) {
  cursor: none;
}
</style>
