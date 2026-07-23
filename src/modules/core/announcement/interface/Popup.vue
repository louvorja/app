<template>
  <div class="w-100 h-100 position-relative" style="background: #000">
    <img
      v-if="data.image"
      :src="data.image"
      class="w-100 h-100"
      style="object-fit: contain; position: absolute; top: 0; left: 0"
    />

    <div
      v-if="data.title || data.text"
      class="position-absolute d-flex flex-column"
      :style="bannerStyle"
    >
      <div v-if="data.title" :style="titleStyle">{{ data.title }}</div>
      <div v-if="data.text" :style="textStyle">{{ data.text }}</div>
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "PopupAnnouncementPage",
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
      return this.$appdata.get("modules.announcement.data") || {};
    },
    bannerStyle() {
      if (this.data.image) {
        return {
          bottom: 0,
          left: 0,
          width: "100%",
          padding: `${this.fontSizePc(4)}px ${this.fontSizePc(5)}px`,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0))",
        };
      }
      return {
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: `${this.fontSizePc(6)}px`,
      };
    },
    titleStyle() {
      return {
        color: "#ffffff",
        fontFamily: "DINCondensedBold, Arial, sans-serif",
        textTransform: "uppercase",
        fontSize: `${this.fontSizePc(this.data.image ? 8 : 14)}px`,
        lineHeight: 1.15,
        marginBottom: `${this.fontSizePc(2)}px`,
      };
    },
    textStyle() {
      return {
        color: "rgba(255, 255, 255, 0.9)",
        fontFamily: "Arial, sans-serif",
        fontSize: `${this.fontSizePc(this.data.image ? 4 : 5.5)}px`,
        lineHeight: 1.4,
        whiteSpace: "pre-wrap",
      };
    },
  },
  methods: {
    fontSizePc(pc) {
      const v = Math.min(this.s_width, this.s_height);
      return (pc * v) / 100 / 2;
    },
    windowResize() {
      const container = this.$el;
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
