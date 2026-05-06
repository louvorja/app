<template>
  <div
    ref="root"
    class="projection-bible-root"
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

    <Transition name="fade-verse" mode="out-in">
      <div v-if="active && text" :key="text" class="projection-bible-content">
        <span
          class="projection-bible-text"
          :style="{
            color: font_color || '#FFFFFF',
            fontSize: font_size_px + 'px',
            fontFamily: font || 'Arial, sans-serif',
            textAlign:
              horizontal_align === 'start'
                ? 'left'
                : horizontal_align === 'end'
                  ? 'right'
                  : 'center',
          }"
        >
          {{ text }}
        </span>

        <span
          class="projection-bible-reference"
          :style="{
            color: reference_font_color || '#FB8C00',
            fontSize: ref_font_size_px + 'px',
            fontFamily: reference_font || 'Arial, sans-serif',
            textAlign: horizontal_align === 'start' ? 'left' : 'right',
          }"
        >
          {{ reference }}
        </span>
      </div>

      <div v-else class="projection-bible-empty">
        <div class="projection-bible-empty__icon">📖</div>
        <div class="projection-bible-empty__hint">Selecione um versículo</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import Broadcast from "@/helpers/Broadcast";
import UserData from "@/helpers/UserData";

const MID = "modules.bible";

const root = ref(null);
const text = ref("");
const reference = ref("");
const active = ref(false);

const sw = ref(0);
const sh = ref(0);

// Reactive trigger: força re-leitura do UserData quando broadcast chega.
const _tick = ref(0);

function ud(key, fallback = null) {
  // _tick.value força recompute quando UserData muda externamente
  void _tick.value;
  const v = UserData.get(`${MID}.${key}`, fallback);
  return v == null ? fallback : v;
}

const font = computed(() => ud("font", "Arial, sans-serif"));
const font_color = computed(() => ud("font_color", "#FFFFFF"));
const font_size = computed(() => ud("font_size", 15));
const reference_font = computed(() => ud("reference_font", "Arial, sans-serif"));
const reference_font_color = computed(() => ud("reference_font_color", "#FB8C00"));
const reference_font_size = computed(() => ud("reference_font_size", 10));
const background_color = computed(() => ud("background_color", "#000000"));
const border_spacing = computed(() => ud("border_spacing", 10));
const vertical_align = computed(() => ud("vertical_align", "center"));
const horizontal_align = computed(() => ud("horizontal_align", "center"));
const image = computed(() => ud("image", ""));
const image_opacity = computed(() => ud("image_opacity", 100));
const image_fit = computed(() => ud("image_fit", "cover"));

function pcToPx(pc) {
  const min = Math.min(sw.value, sh.value);
  return ((pc || 0) * min) / 100 / 2;
}

const font_size_px = computed(() => pcToPx(font_size.value));
const ref_font_size_px = computed(() => pcToPx(reference_font_size.value));
const border_spacing_px = computed(() => pcToPx(border_spacing.value));

useBroadcastListener(BROADCAST_TYPE.BIBLE_VERSE, (payload) => {
  text.value = payload?.text || "";
  reference.value = payload?.reference || "";
  active.value = payload?.active ?? true;
});

// Permite que mudanças de formatação (UserData) também cheguem por broadcast.
useBroadcastListener(BROADCAST_TYPE.BIBLE_FORMAT_CHANGED, () => {
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

  // Pede o versículo atual à janela principal — necessário porque o
  // broadcast BIBLE_VERSE é fire-and-forget: se a projeção abre depois
  // do usuário ter selecionado, não recebe nada e fica vazia.
  // Pequeno delay para garantir que o listener da janela principal já
  // está ativo após o roteamento.
  setTimeout(() => {
    Broadcast.send(BROADCAST_TYPE.REQUEST_BIBLE_STATE, {});
  }, 100);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("keydown", onKey);
});

watch([font, font_color, font_size, background_color, image], onResize);
</script>

<style scoped>
.projection-bible-root {
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

.projection-bible-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
}

.projection-bible-text {
  white-space: pre-wrap;
  line-height: 1.45;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}

.projection-bible-reference {
  margin-top: 0.4em;
  letter-spacing: 0.02em;
}

.projection-bible-empty {
  position: relative;
  z-index: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  user-select: none;
}

.projection-bible-empty__icon {
  font-size: 6vw;
  margin-bottom: 1vw;
  opacity: 0.5;
}

.projection-bible-empty__hint {
  font-size: 1.5vw;
  font-family: Arial, sans-serif;
  letter-spacing: 0.04em;
}

.fade-verse-enter-active,
.fade-verse-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fade-verse-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-verse-leave-to {
  opacity: 0;
}
</style>
