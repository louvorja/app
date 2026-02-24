<template>
  <component
    :is="flatMode ? 'v-sheet' : 'v-dialog'"
    v-model="visible"
    :fullscreen="!flatMode && fullscreen"
    :max-width="flatMode ? undefined : w_width"
    :scrollable="!flatMode"
    :persistent="!flatMode && !closable"
    :no-click-animation="!flatMode && !closable"
    :transition="!flatMode ? (fullscreen ? 'dialog-bottom-transition' : 'dialog-transition') : undefined"
    :scrim="!flatMode ? (dark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)') : undefined"
    :style="!flatMode ? 'z-index: 1000' : 'height: 100%; width: 100%;'"
    :class="{ 'window-flat': flatMode, 'window-dialog': !flatMode, 'elevation-0': !flatMode && !dark }"
    :theme="dark ? 'dark' : ''"
    color="transparent"
  >
    <v-card :color="color ? color : ''" :class="{ 'h-100 flex-column d-flex': flatMode }" elevation="0">
      <slot name="toolbar">
        <div
          class="d-flex flex-no-wrap align-stretch flex-row justify-space-between"
          :class="{ 'window-toolbar-flat': flatMode }"
        >
          <div
            v-if="icon"
            class="d-flex align-center"
            style="margin-left: 20px"
          >
            <v-icon :icon="icon" />
          </div>
          <v-avatar
            v-if="image && $vuetify.display.width > 500"
            class="ma-1"
            :size="imageSize ? imageSize : 65"
            rounded="0"
          >
            <v-img :src="image" />
          </v-avatar>
          <div
            class="flex-grow-1 d-flex flex-column justify-center text-truncate"
          >
            <v-card-title
              v-if="title"
              class="py-0 my-0"
              :class="titleClass ? titleClass : (flatMode ? 'text-h6 font-weight-medium' : 'text-h5 font-weight-light')"
            >
              {{ title }}
            </v-card-title>
            <v-card-subtitle v-if="subtitle" class="pb-1">
              {{ subtitle }}
            </v-card-subtitle>
          </div>
          <div class="d-flex flex-row flex-nowrap align-start" v-if="!flatMode">
            <slot name="system_buttons" />
            <v-btn
              v-if="minimizable"
              class="ms-2"
              icon="mdi-minus"
              variant="text"
              size="small"
              @click="minimize()"
            />
            <v-btn
              v-if="closable"
              class="ms-2"
              icon="mdi-close"
              variant="text"
              size="small"
              @click="close()"
            />
          </div>
        </div>
      </slot>

      <v-card-title v-if="$slots.header">
        <slot name="header" />
      </v-card-title>
      <v-card-text
        ref="container"
        class="d-flex align-stretch overflow-hidden pa-0 ma-0"
        :class="{ 'flex-grow-1': flat }"
      >
        <div
          v-if="$slots.left"
          :style="`${container_height > 0 ? 'height:' + container_height + 'px;' : ''}${slotLeftStyle};`"
          :class="slotLeftClass"
        >
          <slot name="left" />
        </div>
        <div
          ref="main_container"
          class="flex-grow-1 overflow-auto"
          :class="{ 'pa-5': !compact, 'pa-0': compact, 'ma-0': compact }"
          @scroll="scroll"
        >
          <slot />
        </div>
        <div
          v-if="$slots.right"
          :style="`${container_height > 0 ? 'height:' + container_height + 'px;' : ''}${slotRightStyle};`"
          :class="slotRightClass"
        >
          <slot name="right" />
        </div>
      </v-card-text>

      <v-card-actions
        v-if="$slots.footer"
        :class="{ 'pa-0': compact_footer, 'ma-0': compact_footer }"
      >
        <slot name="footer" />
      </v-card-actions>
    </v-card>
  </component>
</template>

<script>
export default {
  name: "WindowComponent",
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    scrollPos: Number,
    title: String,
    subtitle: String,
    icon: String,
    image: String,
    compact: Boolean,
    compact_footer: Boolean,
    closable: Boolean,
    minimizable: Boolean,
    titleClass: String,
    dark: Boolean,
    flat: {
      type: Boolean,
      default: null
    },
    index: [Boolean, Number, String],
    size: String,
    imageSize: Number,
    color: String,
    fullscreen: {
      type: Boolean,
      default: false
    },
    slotLeftClass: String,
    slotRightClass: String,
    slotLeftStyle: [String, Object],
    slotRightStyle: [String, Object],
  },

  data: () => ({
    container_height: 0,
  }),
  computed: {
    visible: {
      get() {
        const val = this.modelValue;
        if (!this.flatMode) {
          console.log(`[Window.vue] Dialog visible=${val} (from modelValue)`);
        }
        return val;
      },
      set(val) {
        this.$emit("update:modelValue", val);
      },
    },
    compact_screen: function () {
      return this.$vuetify.display.width <= 600;
    },
    compact_height: function () {
      return this.$vuetify.display.height <= 600;
    },
    w_width() {
      return this.compact_screen
        ? "100%"
        : this.size == "small"
        ? "500px"
        : this.size == "large"
        ? "95%"
        : "90%";
    },
    w_height() {
      return this.compact_screen || this.compact_height
        ? "100%"
        : this.size == "small"
        ? "550px"
        : "90%";
    },
    flatMode() {
      let isFlat;
      if (this.flat !== null && this.flat !== undefined) {
        isFlat = this.flat;
      } else if (this.$appdata.get("is_popup")) {
        isFlat = false;
      } else {
        isFlat = true;
      }
      console.log(`[Window.vue] title="${this.title}", flat prop=${this.flat}, resolving flatMode=${isFlat}`);
      return isFlat;
    },
  },
  watch: {
    visible() {
      this.listenerResize(this.visible);
    },
    index() {
      this.checkScroll();
      this.windowResize();
    },
    scrollPos(value) {
      const container = this.$refs.main_container;
      if (container) {
        container.scrollTo({
          top: value,
          behavior: "smooth",
        });
      }
    },
  },
  methods: {
    close() {
      this.$emit("close");
    },
    minimize() {
      this.$emit("minimize");
    },
    scroll() {
      let data = {};
      data.scroll_top = this.$refs.main_container.scrollTop;
      data.client_height = this.$refs.main_container.clientHeight;
      data.scroll_height = this.$refs.main_container.scrollHeight;
      data.scroll_bottom =
        data.scroll_height - data.scroll_top - data.client_height;
      this.$emit("scroll", data);
    },
    checkScroll() {
      if (this.$refs.main_container) {
        const div = this.$refs.main_container;
        const hasScroll = div.scrollHeight > div.clientHeight;
        this.$emit("hasScroll", hasScroll);
      } else {
        this.$emit("hasScroll", false);
      }
    },
    windowResize() {
      let el = this.$refs?.container?.$el;
      if (!el) {
        return;
      }

      let data = {
        container_width: el.clientWidth,
        container_height: el.clientHeight,
      };
      this.container_height = el.clientHeight;
      this.$emit("resize", data);
    },

    listenerResize(active) {
      if (active && this.visible) {
        if (this.$refs.container) {
          this.resizeObserver.observe(this.$refs.container.$el);
          window.addEventListener("resize", this.windowResize);
          this.windowResize();
        } else {
          const self = this;
          setTimeout(function () {
            self.listenerResize(active);
            self.checkScroll();
          }, 10);
        }
      } else {
        this.resizeObserver.disconnect();
        window.removeEventListener("resize", this.windowResize);
      }
    },
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(() => {
      this.checkScroll();
    });

    if (this.visible) {
      this.listenerResize(this.visible);
    }
  },
};
</script>
<style scoped>
.window-flat {
  height: 100% !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  background-color: rgb(var(--v-theme-background));
}

.window-toolbar-flat {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  min-height: 48px;
  max-height: 48px;
  padding: 0 8px;
}
</style>
