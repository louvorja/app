<template>
  <Slide v-if="slide" :slide="slide" :title="title" />
</template>

<script setup>
import Slide from "@/components/Slide.vue";
import { useProjectionState } from "@/composables/useProjectionState";

// Janela popup é uma janela Electron separada e tem Pinia store próprio.
// $appdata da janela principal não está visível aqui — escutamos o slide
// via BroadcastChannel (mesma estratégia da Projection.vue). O composable
// já solicita REQUEST_SLIDE_STATE no mount para sincronizar com a janela
// principal mesmo se o popup abre depois da música tocar.
const { slide, title } = useProjectionState();
</script>
