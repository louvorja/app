<template>
  <l-slide
    v-if="slide"
    :slide_number="slideIndex"
    :cover="isCover"
    :text="slide.lyric"
    :aux_text="slide.lyric_aux"
    :image="slide.url_image ? pathFile(slide.url_image) : null"
    :image_position="slide.image_position"
  />
</template>

<script setup>
import LSlide from "@/components/Slide.vue";
import Path from "@/helpers/Path";
import { useProjectionState } from "@/composables/useProjectionState";

// Janela popup é uma janela Electron separada e tem Pinia store próprio.
// $appdata da janela principal não está visível aqui — escutamos o slide
// via BroadcastChannel (mesma estratégia da Projection.vue). O composable
// já solicita REQUEST_SLIDE_STATE no mount para sincronizar com a janela
// principal mesmo se o popup abre depois da música tocar.
const { slide, slideIndex, isCover } = useProjectionState();

function pathFile(img) {
  return Path.file(img);
}
</script>
