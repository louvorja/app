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

<script>
import LPlayer from "@/components/Player.vue";

export default {
  name: "FullscreenPlayerComponent",
  components: {
    LPlayer,
  },
  data() {
    return {
      visible: false,
      start_timer: true,
      timeout: null,
    };
  },
  beforeUnmount() {
    clearTimeout(this.timeout); // Limpa o temporizador ao destruir o componente
  },
  methods: {
    mouseMove() {
      if (!this.start_timer) {
        return;
      }
      this.showChild();
      this.startHideTimer();
    },
    mouseEnter() {
      this.start_timer = false;
      clearTimeout(this.timeout);
    },
    mouseLeave() {
      this.start_timer = true;
      this.startHideTimer();
    },
    showChild() {
      this.visible = true; // Torna a div filho visível
      clearTimeout(this.timeout); // Cancela qualquer temporizador ativo
    },
    startHideTimer() {
      clearTimeout(this.timeout); // Cancela qualquer temporizador anterior
      this.timeout = setTimeout(() => {
        this.visible = false; // Oculta a div filho após um tempo
      }, 1000);
    },
  },
};
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
