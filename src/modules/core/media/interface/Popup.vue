<template>
  <l-slide
    v-if="slide"
    :slide_number="config.slide_index"
    :cover="slide.cover == true"
    :text="slide.lyric"
    :aux_text="slide.aux_lyric"
    :image="slide.url_image ? $path.file(slide.url_image) : null"
    :image_position="slide.image_position"
    :musicianMode="musicianMode"
  />
</template>

<script>
import manifest from "../manifest.json";

import LSlide from "@/components/Slide.vue";

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
      return this.$modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
    config() {
      return this.$media.config();
    },
    slide_index() {
      return this.config.slide_index;
    },
    slide() {
      return this.$media.slide();
    },
    musicianMode() {
      return !!this.$appdata.get("musician_mode");
    },
  },
};
</script>
