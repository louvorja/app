<template>
  <div
    class="projection-root"
    :class="[
      { 'projection-root--ready': ready, 'projection-root--leaving': leaving },
      `projection-root--align-${slideStyle.cfg.value.text_align}`,
    ]"
    :style="rootStyle"
  >
    <!-- Fundo com imagem (sem transição: troca instantânea como no Delphi) -->
    <div
      v-if="(slide && slide.url_image) || slideStyle.cfg.value.background_image"
      :key="slide?.url_image || slideStyle.cfg.value.background_image"
      class="projection-bg"
      :style="slideStyle.bgStyle(slide)"
    />

    <!-- Título da música no primeiro slide (configurável) -->
    <div
      v-if="slideStyle.cfg.value.show_title_first_slide && isCover && title"
      class="projection-title"
    >
      {{ title }}
    </div>

    <!-- Texto: troca INSTANTÂNEA entre slides (fiel ao Delphi) -->
    <div class="projection-content">
      <div
        v-if="slide && (slide.lyric || slide.name)"
        class="projection-text"
        :class="{ 'projection-text--cover': isCover }"
        :style="textStyle"
        data-testid="slide-content"
        v-html="slide.lyric || slide.name"
      />
    </div>

    <!-- Texto auxiliar (lblLetra_aux Delphi) -->
    <div v-if="slide && slide.lyric_aux" class="projection-content projection-content--aux">
      <div
        class="projection-text projection-text--aux"
        :style="slideStyle.auxStyle(slide)"
        v-html="slide.lyric_aux"
      />
    </div>

    <!-- Barra de progresso inferior -->
    <div
      v-if="slideStyle.cfg.value.show_progress_bar"
      class="projection-progress"
      :style="{ width: progress + '%', background: slideStyle.cfg.value.progress_color }"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useProjectionState } from "@/composables/useProjectionState";
import { useSlideStyle } from "@/composables/useSlideStyle";
import $broadcast from "@/helpers/Broadcast";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";

const { slide, isCover, progress, title, slideIndex, totalSlides } = useProjectionState();
const slideStyle = useSlideStyle();
const rootStyle = slideStyle.rootStyle;

const ready = ref(false);
const leaving = ref(false);

// Decide entre estilo de capa e letra com base em isCover.
const textStyle = computed(() =>
  isCover.value ? slideStyle.coverStyle(slide.value) : slideStyle.lyricStyle(slide.value)
);

function _beginLeave() {
  leaving.value = true;
}

function _goTo(index) {
  if (totalSlides.value <= 0) return;
  const clamped = Math.max(0, Math.min(totalSlides.value - 1, index));
  $broadcast.send(BROADCAST_TYPE.GO_TO_SLIDE, { index: clamped });
}

function _onKey(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    _beginLeave();
    setTimeout(() => window.close(), 200);
  } else if (
    e.key === "ArrowRight" ||
    e.key === "ArrowDown" ||
    e.key === "PageDown" ||
    e.key === " "
  ) {
    e.preventDefault();
    _goTo(slideIndex.value + 1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    _goTo(slideIndex.value - 1);
  } else if (e.key === "Home") {
    e.preventDefault();
    _goTo(0);
  } else if (e.key === "End") {
    e.preventDefault();
    _goTo(totalSlides.value - 1);
  }
}

onMounted(() => {
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#000";

  // Fade-in da janela inteira (replica AlphaBlend 0→255 do fmMusica Delphi)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready.value = true;
    });
  });

  // Fade-out ao fechar (Esc do operator ou close do BroadcastChannel)
  window.addEventListener("beforeunload", _beginLeave);
  window.addEventListener("keydown", _onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", _beginLeave);
  window.removeEventListener("keydown", _onKey);
});
</script>

<style scoped>
.projection-root,
.projection-root :deep(*) {
  cursor: none;
}

.projection-root {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: var(--lj-font-projection);
  background: #000;
  /* Fade-in via opacity 0→1 em 256ms (replica AlphaBlend Delphi) */
  opacity: 0;
  transition: opacity 256ms linear;
}

.projection-root--ready {
  opacity: 1;
}
.projection-root--leaving {
  opacity: 0;
}

.projection-bg {
  position: absolute;
  inset: 0;
  /* Sem transição: troca instantânea de fundo (fiel ao Delphi) */
}

.projection-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

/* Alinhamento configurável (options.slides.text_align) */
.projection-root--align-top .projection-content {
  align-items: flex-start;
  padding-top: 8vh;
}
.projection-root--align-bottom .projection-content {
  align-items: flex-end;
  padding-bottom: 8vh;
}

.projection-content--aux {
  align-items: flex-start;
  padding-top: 6vh;
}

.projection-title {
  position: absolute;
  top: 2vh;
  left: 0;
  right: 0;
  text-align: center;
  font-size: clamp(14px, 2.5vh, 30px);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  z-index: 1;
}

.projection-text {
  letter-spacing: 0.01em;
  text-transform: none;
}

.projection-text--cover {
  letter-spacing: 0.02em;
}

.projection-text--aux {
  opacity: 0.95;
}

.projection-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  transition: width 0.6s linear;
}
</style>
