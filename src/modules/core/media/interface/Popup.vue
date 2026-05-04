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

<script>
import manifest from "../manifest.json";

import LSlide from "@/components/Slide.vue";
import Modules from "@/helpers/Modules";
import Media from "@/composables/useMedia";
import Path from "@/helpers/Path";

export default {
  name: "PopupMediaPage",
  components: {
    LSlide,
  },
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return Modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
    config() {
      return Media.config();
    },
    slide_index() {
      return this.config.slide_index;
    },
    slide() {
      return Media.slide();
    },
  },
  methods: {
    pathFile(img) {
      return Path.file(img);
    },
  },
};
</script>
