<template>
  <v-dialog
    v-model="visible"
    scrollable
    persistent
    class="lj-window"
    :width="w_width"
    :height="w_height"
    :theme="dark ? 'dark' : ''"
    @click:outside="minimize"
    @keydown.esc="minimize"
  >
    <v-card class="lj-window-card" :color="color ? color : ''">
      <slot name="toolbar">
        <header class="lj-window-toolbar">
          <div v-if="icon" class="lj-window-icon">
            <v-icon :icon="icon" size="20" />
          </div>
          <div
            v-if="image && $vuetify.display.width > 500"
            class="lj-window-image"
            :style="{ width: (imageSize || 65) + 'px', height: (imageSize || 65) + 'px' }"
          >
            <img :src="image" alt="" />
          </div>
          <div class="lj-window-titles">
            <h2 v-if="title" class="lj-window-title" :class="titleClass">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="lj-window-subtitle">{{ subtitle }}</p>
          </div>
          <div class="lj-window-actions">
            <slot name="system_buttons" />

            <l-customization-bar v-if="$slots.customize">
              <slot name="customize" />
            </l-customization-bar>

            <span v-if="$slots.customize || $slots.system_buttons" class="lj-window-divider" />

            <button
              v-if="minimizable"
              type="button"
              class="lj-window-btn"
              :title="$t('shell.window.minimize')"
              @click="minimize()"
            >
              <v-icon icon="mdi-minus" size="16" />
            </button>
            <button
              v-if="closable"
              type="button"
              class="lj-window-btn lj-window-btn--close"
              :title="$t('alert.close')"
              @click="close()"
            >
              <v-icon icon="mdi-close" size="16" />
            </button>
          </div>
        </header>
      </slot>

      <v-card-title v-if="$slots.header">
        <slot name="header" />
      </v-card-title>
      <v-card-text ref="container" class="d-flex align-stretch overflow-hidden pa-0 ma-0">
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
  components: {
    LCustomizationBar,
  },
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
  mounted() {
    this.resizeObserver = new ResizeObserver(() => {
      this.checkScroll();
    });

    if (this.visible) {
      this.listenerResize(this.visible);
    }
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
      data.scroll_bottom = data.scroll_height - data.scroll_top - data.client_height;
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
};
</script>

<style scoped>
.lj-window-card {
  font-family: var(--lj-font-shell);
  border-radius: var(--lj-radius-md);
  overflow: hidden;
}

.lj-window-toolbar {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  padding: var(--lj-space-3) var(--lj-space-4);
  background: var(--lj-surface-bg-soft);
  border-bottom: 1px solid var(--lj-surface-divider);
  min-height: 52px;
}

.lj-window-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--lj-navy);
}

.lj-window-image {
  flex-shrink: 0;
  border-radius: var(--lj-radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lj-surface-bg);
}

.lj-window-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lj-window-titles {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lj-window-title {
  margin: 0;
  font-size: var(--lj-text-xl);
  font-weight: var(--lj-weight-regular);
  color: var(--lj-text);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.lj-window-subtitle {
  margin: 2px 0 0;
  font-size: var(--lj-text-base);
  color: var(--lj-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lj-window-actions {
  display: flex;
  align-items: center;
  gap: var(--lj-space-1);
  flex-shrink: 0;
}

.lj-window-divider {
  width: 1px;
  height: 24px;
  background: var(--lj-surface-border);
  margin: 0 var(--lj-space-2);
}

.lj-window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  border-radius: var(--lj-radius-sm);
  color: var(--lj-text-muted);
  cursor: pointer;
  transition:
    background var(--lj-transition-fast),
    color var(--lj-transition-fast);
  font-family: inherit;
}

.lj-window-btn:hover {
  background: var(--lj-hover-bg);
  color: var(--lj-text);
}

.lj-window-btn--close:hover {
  background: var(--lj-danger);
  color: var(--lj-white);
}
</style>
