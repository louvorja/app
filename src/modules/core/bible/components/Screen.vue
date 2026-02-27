<template>
  <div
    ref="container"
    class="d-flex align-center justify-center"
    :style="{
      background: userdata.background_color,
      width: '100%',
      height: height ? height + 'px' : '100%',
      padding: `${this.fontSizePc(userdata.border_spacing)}px`,
    }"
  >
    <div v-if="bible" class="d-flex flex-column">
      <span
        v-if="bible.text"
        class="text-center"
        :style="{
          color: userdata.font_color,
          fontSize: `${this.fontSizePc(userdata.font_size)}px`,
          fontFamily: userdata.font || 'Arial, sans-serif',
        }"
      >
        {{ bible.text }}
      </span>
      <span
        v-if="bible.scriptural_reference"
        class="text-right"
        :style="{
          color: userdata.reference_font_color,
          fontSize: `${this.fontSizePc(userdata.reference_font_size)}px`,
          fontFamily: userdata.reference_font || 'Arial, sans-serif',
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
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return this.$userdata.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            this.$userdata.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        },
      );
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
