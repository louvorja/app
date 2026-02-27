<template>
  <v-dialog
    v-model="visible"
    scrollable
    persistent
    :width="w_width"
    :height="w_height"
    :theme="dark ? 'dark' : ''"
  >
    <v-card :color="color ? color : ''">
      <slot name="toolbar">
        <div
          class="d-flex flex-no-wrap align-stretch flex-row justify-space-between"
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
              :class="titleClass ? titleClass : 'text-h5 font-weight-light'"
            >
              {{ title }}
            </v-card-title>
            <v-card-subtitle v-if="subtitle" class="pb-1">
              {{ subtitle }}
            </v-card-subtitle>
          </div>
          <div class="d-flex flex-row flex-nowrap align-start">
            <slot name="system_buttons" />

            <l-customization-bar v-if="$slots.customize">
              <slot name="customize" />
            </l-customization-bar>

            <v-divider
              v-if="$slots.customize || $slots.system_buttons"
              vertical
              class="ms-2"
            />

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
      >
        <div
          v-if="$slots.left"
          :style="`height:${container_height}px;${slotLeftStyle};`"
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
          :style="`height:${container_height}px;${slotRightStyle};`"
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
  </v-dialog>
</template>

<script>
import LCustomizationBar from "@/components/CustomizationBar.vue";

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
    index: [Boolean, Number, String],
    size: String,
    imageSize: Number,
    color: String,
    slotLeftClass: String,
    slotRightClass: String,
    slotLeftStyle: [String, Object],
    slotRightStyle: [String, Object],
  },
  components: {
    LCustomizationBar,
  },

  data: () => ({
    container_height: 0,
  }),
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
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
