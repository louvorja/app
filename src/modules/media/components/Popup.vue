<template>
  <l-slide
    v-if="slide"
    :slide_number="config.slide_index"
    :cover="slide.cover == true"
    :text="slide.lyric"
    :aux_text="slide.aux_lyric"
    :image="slide.url_image ? pathFile(slide.url_image) : null"
    :image_position="slide.image_position"
  />
</template>

<script setup>
import { computed } from "vue";
import LSlide from "@/components/Slide.vue";
import Media from "@/composables/useMedia";
import Path from "@/helpers/Path";

const config = computed(() => Media.config());
const slide = computed(() => Media.slide());

function pathFile(img) {
  return Path.file(img);
}
</script>
