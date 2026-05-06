<template>
  <div
    class="position-absolute w-100 h-100 top-0 left-0"
    style="z-index: 9999"
    @mousemove="mouseMove"
  >
    <transition name="slide-up">
      <div
        v-if="visible"
        class="position-absolute w-100 bottom-0"
        @mouseenter="mouseEnter"
        @mouseleave="mouseLeave"
      >
        <l-player location="fullscreen" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from "vue";
import LPlayer from "@/components/Player.vue";

const visible = ref(false);
const start_timer = ref(true);
let timeout = null;

onBeforeUnmount(() => clearTimeout(timeout));

function mouseMove() {
  if (!start_timer.value) return;
  showChild();
  startHideTimer();
}

function mouseEnter() {
  start_timer.value = false;
  clearTimeout(timeout);
}

function mouseLeave() {
  start_timer.value = true;
  startHideTimer();
}

function showChild() {
  visible.value = true;
  clearTimeout(timeout);
}

function startHideTimer() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    visible.value = false;
  }, 1000);
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  /* Subida/descida do player em fullscreen — antes 0.3s, agora 0.15s pra UX */
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
