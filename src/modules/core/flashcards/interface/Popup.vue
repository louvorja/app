<template>
  <div
    ref="container"
    class="w-100 h-100 d-flex flex-column align-center justify-center position-relative"
    style="background: #000; padding: 4%"
  >
    <div class="position-absolute d-flex align-center" :style="badgeStyle">
      <div :style="badgeTextStyle">
        {{ data.show_answer ? "RESPOSTA" : "PERGUNTA" }}
      </div>
    </div>

    <div v-if="data.deck_title" :style="deckTitleStyle">{{ data.deck_title }}</div>
    <div :style="cardTextStyle">
      {{ data.show_answer ? data.back : data.front }}
    </div>

    <div v-if="data.total" class="position-absolute" :style="positionStyle">
      {{ data.position }} / {{ data.total }}
    </div>
  </div>
</template>

<script>
import manifest from "../manifest.json";

export default {
  name: "PopupFlashcardsPage",
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
      return this.$appdata.get("modules.flashcards.data") || {};
    },
    accentColor() {
      return this.data.show_answer ? "#448d21" : "#ffa92d";
    },
    badgeStyle() {
      return {
        top: `${this.fontSizePc(4)}px`,
        left: "50%",
        transform: "translateX(-50%)",
        padding: `${this.fontSizePc(1)}px ${this.fontSizePc(3)}px`,
        borderRadius: "999px",
        border: `2px solid ${this.accentColor}`,
      };
    },
    badgeTextStyle() {
      return {
        color: this.accentColor,
        fontFamily: "DINCondensedBold, Arial, sans-serif",
        letterSpacing: "0.15em",
        fontSize: `${this.fontSizePc(3.2)}px`,
      };
    },
    deckTitleStyle() {
      return {
        color: "rgba(255, 255, 255, 0.6)",
        fontFamily: "Arial, sans-serif",
        fontSize: `${this.fontSizePc(3.5)}px`,
        marginBottom: `${this.fontSizePc(3)}px`,
        textAlign: "center",
      };
    },
    cardTextStyle() {
      return {
        color: "#ffffff",
        fontFamily: "DINCondensedBold, Arial, sans-serif",
        fontSize: `${this.fontSizePc(10)}px`,
        lineHeight: 1.2,
        textAlign: "center",
        maxWidth: "90%",
      };
    },
    positionStyle() {
      return {
        bottom: `${this.fontSizePc(3)}px`,
        right: `${this.fontSizePc(3)}px`,
        color: "rgba(255, 255, 255, 0.5)",
        fontFamily: "Arial, sans-serif",
        fontSize: `${this.fontSizePc(3)}px`,
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
