<template>
  <div
    class="projection-root"
    :class="{ 'projection-root--ready': ready, 'projection-root--leaving': leaving }"
    :style="{ background: config.bg }"
  >
    <!-- Fundo com imagem (sem transição: troca instantânea como no Delphi) -->
    <div
      v-if="slide && slide.url_image"
      :key="slide.url_image"
      class="projection-bg"
      :style="bgImgStyle"
    />

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
        :style="auxTextStyle"
        v-html="slide.lyric_aux"
      />
    </div>

    <!-- Barra de progresso inferior -->
    <div
      class="projection-progress"
      :style="{ width: progress + '%', background: config.progress_color }"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  useProjectionState,
  COLOR_COVER_GOLD,
  COLOR_LYRIC_WHITE,
} from "@/composables/useProjectionState";

const { slide, isCover, bgImgStyle, progress } = useProjectionState();

const ready = ref(false);
const leaving = ref(false);
const config = ref({
  bg: "#000",
  text_color: "#fff",
  font_size: 54,
  progress_color: "#EFB400",
});

// textStyle e auxTextStyle são específicos desta view (isCover e bgImgStyle vêm do composable).
const textStyle = computed(() => {
  const baseColor = isCover.value
    ? slide.value?.color || COLOR_COVER_GOLD
    : slide.value?.color || config.value.text_color || COLOR_LYRIC_WHITE;
  const sizePercent = Number(slide.value?.font_size_pct) || (isCover.value ? 18 : 14);
  return {
    color: baseColor,
    fontSize: `clamp(28px, ${sizePercent}vh, 200px)`,
    textAlign: "center",
    textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
    lineHeight: 1.3,
    fontWeight: isCover.value ? 700 : 600,
    maxWidth: "92vw",
  };
});

const auxTextStyle = computed(() => {
  const baseColor = slide.value?.color_aux || COLOR_COVER_GOLD;
  const sizePercent = Number(slide.value?.font_size_aux_pct) || 8;
  return {
    color: baseColor,
    fontSize: `clamp(20px, ${sizePercent}vh, 120px)`,
    textAlign: "center",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
    lineHeight: 1.3,
    fontWeight: 600,
    maxWidth: "92vw",
  };
});

function _beginLeave() {
  leaving.value = true;
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
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", _beginLeave);
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

.projection-content--aux {
  align-items: flex-start;
  padding-top: 6vh;
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
