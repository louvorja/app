<template>
  <div
    ref="container"
    class="w-100 h-100 d-flex flex-column align-center justify-center"
    style="background: #000; padding: 4%"
  >
    <div style="width: 100%; max-width: 90%; text-align: center">
      <div v-if="data.sermon_title" :style="sermonTitleStyle">
        {{ data.sermon_title }}
      </div>
      <div v-if="data.title" :style="titleStyle">
        {{ data.title }}
      </div>
      <div v-if="data.text" :style="textStyle">
        {{ data.text }}
      </div>
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "PopupSermonPage",
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

    data() {
      return this.$appdata.get("modules.sermon.data") || {};
    },
    sermonTitleStyle() {
      return {
        color: "#ffa92d",
        fontFamily: "DINCondensedBold, Arial, sans-serif",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontSize: `${this.fontSizePc(8)}px`,
        marginBottom: `${this.fontSizePc(3)}px`,
        opacity: 0.85,
      };
    },
    titleStyle() {
      return {
        color: "#ffffff",
        fontFamily: "DINCondensedBold, Arial, sans-serif",
        textTransform: "uppercase",
        fontSize: `${this.fontSizePc(16)}px`,
        lineHeight: 1.15,
        marginBottom: `${this.fontSizePc(4)}px`,
      };
    },
    textStyle() {
      return {
        color: "rgba(255, 255, 255, 0.88)",
        fontFamily: "Arial, sans-serif",
        fontSize: `${this.fontSizePc(6)}px`,
        lineHeight: 1.4,
      };
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

        if (this.s_width <= 0 || this.s_height <= 0) {
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
