<template>
  <div
    ref="root"
    class="module-projection"
    :class="[`align-${vertical_align}`, `justify-${horizontal_align}`]"
    :style="{
      background: background_color || '#000000',
      padding: `${border_spacing_px}px`,
    }"
  >
    <img
      v-if="image"
      :src="image"
      alt=""
      :style="{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: image_fit || 'cover',
        opacity: (image_opacity ?? 100) / 100,
        zIndex: 0,
      }"
    />

    <Transition :name="isLive ? 'no-transition' : 'fade-content'" mode="out-in">
      <div v-if="active && (text || extra)" :key="transitionKey" class="module-projection__content">
        <span
          v-if="text"
          class="module-projection__text"
          :style="{
            color: font_color || '#FFFFFF',
            fontSize: font_size_px + 'px',
            fontFamily: font || 'Arial, sans-serif',
            textAlign: textAlign,
          }"
        >
          {{ text }}
        </span>

        <span
          v-if="extra"
          class="module-projection__extra"
          :style="{
            color: reference_font_color || font_color || '#FB8C00',
            fontSize: ref_font_size_px + 'px',
            fontFamily: reference_font || font || 'Arial, sans-serif',
            textAlign: extraAlign,
          }"
        >
          {{ extra }}
        </span>
      </div>

      <div v-else class="module-projection__empty">
        <div class="module-projection__empty-icon">{{ emptyIcon }}</div>
        <div class="module-projection__empty-hint">{{ emptyHint }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import Broadcast from "@/helpers/Broadcast";
import UserData from "@/helpers/UserData";

const route = useRoute();

// O moduleId vem da query string `?module=<id>`. Útil porque uma única view
// genérica /projection/module serve para vários módulos.
const moduleId = computed(() => String(route.query.module || ""));
const MID = computed(() => `modules.${moduleId.value}`);

const root = ref(null);
const text = ref("");
const extra = ref(""); // referência, "Sorteado:", etc.
const active = ref(false);
const sw = ref(0);
const sh = ref(0);

// Tick force re-read do UserData quando broadcast chega.
const _tick = ref(0);

function ud(key, fallback = null) {
  void _tick.value;
  if (!moduleId.value) return fallback;
  const v = UserData.get(`${MID.value}.${key}`, fallback);
  return v == null ? fallback : v;
}

const font = computed(() => ud("font", "Arial, sans-serif"));
const font_color = computed(() => ud("font_color", "#FFFFFF"));
const font_size = computed(() => ud("font_size", 15));
const reference_font = computed(() => ud("reference_font", null));
const reference_font_color = computed(() => ud("reference_font_color", "#FB8C00"));
const reference_font_size = computed(() => ud("reference_font_size", 10));
const background_color = computed(() => ud("background_color", "#000000"));
const border_spacing = computed(() => ud("border_spacing", 10));
const vertical_align = computed(() => ud("vertical_align", "center"));
const horizontal_align = computed(() => ud("horizontal_align", "center"));
const image = computed(() => ud("image", ""));
const image_opacity = computed(() => ud("image_opacity", 100));
const image_fit = computed(() => ud("image_fit", "cover"));

const textAlign = computed(() => {
  const h = horizontal_align.value;
  return h === "start" ? "left" : h === "end" ? "right" : "center";
});
const extraAlign = computed(() => (horizontal_align.value === "start" ? "left" : "right"));

function pcToPx(pc) {
  const min = Math.min(sw.value, sh.value);
  return ((pc || 0) * min) / 100 / 2;
}

const font_size_px = computed(() => pcToPx(font_size.value));
const ref_font_size_px = computed(() => pcToPx(reference_font_size.value));
const border_spacing_px = computed(() => pcToPx(border_spacing.value));

// Módulos com valor que muda continuamente (clock, stopwatch) — desabilita
// a transição fade pra não "piscar" a cada segundo. A `key` fica estável
// (apenas troca quando active passa para true/false).
const LIVE_MODULES = new Set(["clock", "stopwatch", "timer_cult"]);
const isLive = computed(() => LIVE_MODULES.has(moduleId.value));
const transitionKey = computed(() =>
  isLive.value ? `live:${active.value}` : `${text.value}|${extra.value}`
);

const EMPTY_ICONS = {
  bible: "📖",
  message_board: "📋",
  draw: "🎲",
  name_draw: "👥",
  counter: "🔢",
  clock: "🕐",
  stopwatch: "⏱",
  timer_cult: "⏳",
};
const emptyIcon = computed(() => EMPTY_ICONS[moduleId.value] || "🖥");
const emptyHint = computed(() => "Aguardando…");

useBroadcastListener(BROADCAST_TYPE.MODULE_PROJECTION_VALUE, (payload) => {
  if (!payload || payload.module !== moduleId.value) return;
  text.value = payload.text || "";
  extra.value = payload.reference || payload.extra || "";
  active.value = payload.active ?? true;
});

useBroadcastListener(BROADCAST_TYPE.MODULE_FORMAT_CHANGED, (payload) => {
  if (!payload || payload.module !== moduleId.value) return;
  _tick.value += 1;
});

function onResize() {
  if (!root.value) return;
  sw.value = root.value.offsetWidth;
  sh.value = root.value.offsetHeight;
}

function onKey(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    setTimeout(() => window.close(), 150);
  }
}

onMounted(() => {
  document.documentElement.style.background = "#000";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#000";
  document.body.style.height = "100vh";
  onResize();
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKey);

  // Pede o estado atual à janela principal (request-state pattern).
  setTimeout(() => {
    Broadcast.send(BROADCAST_TYPE.REQUEST_MODULE_STATE, { module: moduleId.value });
  }, 100);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("keydown", onKey);
});

watch([font, font_color, font_size, background_color, image], onResize);
</script>

<style scoped>
.module-projection {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
}

.align-start {
  align-items: flex-start;
}
.align-center {
  align-items: center;
}
.align-end {
  align-items: flex-end;
}

.justify-start {
  justify-content: flex-start;
}
.justify-center {
  justify-content: center;
}
.justify-end {
  justify-content: flex-end;
}

.module-projection__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
}

.module-projection__text {
  white-space: pre-wrap;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}

.module-projection__extra {
  margin-top: 0.4em;
  letter-spacing: 0.02em;
}

.module-projection__empty {
  position: relative;
  z-index: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.32);
  user-select: none;
}

.module-projection__empty-icon {
  font-size: 6vw;
  margin-bottom: 1vw;
  opacity: 0.55;
}

.module-projection__empty-hint {
  font-size: 1.5vw;
  font-family: Arial, sans-serif;
  letter-spacing: 0.04em;
}

.fade-content-enter-active,
.fade-content-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fade-content-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-content-leave-to {
  opacity: 0;
}

/* Módulos "live" (clock/stopwatch) — sem transição entre tics. */
.no-transition-enter-active,
.no-transition-leave-active {
  transition: none;
}
</style>
