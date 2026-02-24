<template>
  <div
    ref="container"
    class="d-flex align-center justify-center"
    :style="{
      background: config.background,
      width: '100%',
      height: height ? height + 'px' : '100%',
      color: config.textColor,
    }"
  >
    <div v-if="bible" class="d-flex flex-column">
      <span
        v-if="bible.text"
        class="text-center"
        :style="{ 
          fontSize: config.textFontSize ? config.textFontSize + 'px' : `${this.fontSizePc(15)}px`,
          fontFamily: config.fontFamily || 'Arial, sans-serif'
        }"
      >
        {{ bible.text }}
      </span>
      <span
        v-if="bible.scriptural_reference"
        class="text-right"
        :style="{ 
          fontSize: config.referenceFontSize ? config.referenceFontSize + 'px' : `${this.fontSizePc(10)}px`,
          fontFamily: config.fontFamily || 'Arial, sans-serif',
          color: config.referenceColor || config.textColor
        }"
      >
        {{ bible.scriptural_reference }}
      </span>
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "ScreenBiblePage",
  props: {
    height: Number,
    config: {
      type: Object,
      default: () => ({
        background: '#000000',
        textColor: '#ffffff',
        referenceColor: '#aaaaaa',
        textFontSize: 48,
        referenceFontSize: 32,
        fontFamily: 'Arial, sans-serif',
      })
    },
  },
  data: () => ({
    s_width: 0,
    s_height: 0,
  }),
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
    bible() {
      return this.$appdata.get("modules.bible.data");
    },
  },
  methods: {
    fontSizePc(pc) {
      const v = Math.min(this.s_width, this.s_height);
      return (pc * v) / 100 / 2;
    },
    windowResize() {
      const container = this.$refs.container;
      if (container) {
        this.s_width = container.offsetWidth;
        this.s_height = container.offsetHeight;

        if (this.width <= 0 || this.height <= 0) {
          const self = this;
          setTimeout(function () {
            self.windowResize();
          }, 100);
        }
      }
    },
  },
  mounted() {
    this.windowResize();
    window.addEventListener("resize", this.windowResize);
  },
  unmounted() {
    window.removeEventListener("resize", this.windowResize);
  },
};
</script>
