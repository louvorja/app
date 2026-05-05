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
            v-if="image && display.width.value > 500"
            class="lj-window-image"
            :style="{ width: (imageSize || 65) + 'px', height: (imageSize || 65) + 'px' }"
          >
            <img :src="image" alt="" loading="lazy" />
          </div>
          <div class="lj-window-titles">
            <h2 v-if="title" class="lj-window-title" :class="titleClass">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="lj-window-subtitle">{{ subtitle }}</p>
          </div>
          <div class="lj-window-actions">
            <slot name="system_buttons" />

            <span v-if="$slots.system_buttons" class="lj-window-divider" />

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

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useDisplay } from "vuetify";

const props = defineProps({
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
});

const emit = defineEmits([
  "update:modelValue",
  "close",
  "minimize",
  "scroll",
  "hasScroll",
  "resize",
]);

const display = useDisplay();
const container = ref(null);
const main_container = ref(null);
const container_height = ref(0);
let resizeObserver = null;

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const compact_screen = computed(() => display.width.value <= 600);
const compact_height = computed(() => display.height.value <= 600);

const w_width = computed(() => {
  if (compact_screen.value) return "100%";
  if (props.size == "small") return "500px";
  if (props.size == "large") return "95%";
  return "90%";
});

const w_height = computed(() => {
  if (compact_screen.value || compact_height.value) return "100%";
  if (props.size == "small") return "550px";
  return "90%";
});

watch(visible, (val) => listenerResize(val));

watch(
  () => props.index,
  () => {
    checkScroll();
    windowResize();
  }
);

watch(
  () => props.scrollPos,
  (value) => {
    const el = main_container.value;
    if (el) {
      el.scrollTo({ top: value, behavior: "smooth" });
    }
  }
);

onMounted(() => {
  // ResizeObserver dispara em layout changes — atualiza height E scroll
  // (antes só chamava checkScroll, deixando container_height em 0 quando
  // o v-dialog abria com layout async, resultando em #left/#right invisíveis
  // e o body do Window aparecendo vazio/preto).
  resizeObserver = new ResizeObserver(() => {
    windowResize();
    checkScroll();
  });
  if (visible.value) listenerResize(true);
});

function close() {
  emit("close");
}

function minimize() {
  emit("minimize");
}

function scroll() {
  const el = main_container.value;
  emit("scroll", {
    scroll_top: el.scrollTop,
    client_height: el.clientHeight,
    scroll_height: el.scrollHeight,
    scroll_bottom: el.scrollHeight - el.scrollTop - el.clientHeight,
  });
}

function checkScroll() {
  const el = main_container.value;
  emit("hasScroll", el ? el.scrollHeight > el.clientHeight : false);
}

function windowResize() {
  const el = container.value?.$el;
  if (!el) return;
  container_height.value = el.clientHeight;
  emit("resize", {
    container_width: el.clientWidth,
    container_height: el.clientHeight,
  });
}

function listenerResize(active) {
  if (active && visible.value) {
    if (container.value) {
      resizeObserver.observe(container.value.$el);
      window.addEventListener("resize", windowResize);
      windowResize();
    } else {
      setTimeout(() => {
        listenerResize(active);
        checkScroll();
      }, 10);
    }
  } else {
    resizeObserver?.disconnect();
    window.removeEventListener("resize", windowResize);
  }
}
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
