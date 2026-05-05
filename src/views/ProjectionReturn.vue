<template>
  <div class="return-root" :class="{ 'return-root--ready': ready }">
    <!-- Slide atual ocupa quase toda a tela (alClient) -->
    <div class="return-current">
      <!-- Imagem de fundo do slide atual -->
      <div
        v-if="(slide && slide.url_image) || slideStyle.cfg.value.background_image"
        :key="slide?.url_image || slideStyle.cfg.value.background_image"
        class="return-bg"
        :style="slideStyle.bgStyle(slide)"
      />

      <div class="return-current-text">
        <div
          v-if="slide && (slide.lyric || slide.name)"
          class="return-text"
          :class="{ 'return-text--cover': isCover }"
          :style="textStyle"
          v-html="slide.lyric || slide.name"
        />
      </div>

      <!-- Título da música no topo -->
      <div v-if="title" class="return-title">{{ title }}</div>

      <!-- Barra de progresso fina no rodapé do painel atual -->
      <div v-if="slideStyle.cfg.value.show_progress_bar" class="return-progress-bar">
        <div
          class="return-progress-fill"
          :style="{ width: progress + '%', background: slideStyle.cfg.value.progress_color }"
        />
      </div>
    </div>

    <!-- Painel fixo no rodapé com próximo slide + contador (alBottom Delphi) -->
    <div class="return-bottom">
      <div class="return-bottom-grid">
        <div class="return-next-text">
          <span class="return-next-label">{{ t("shell.proj_return_next") }}</span>
          <span
            class="return-next-content"
            :style="slideStyle.nextStyle(nextSlide)"
            v-html="nextSlide?.lyric || nextSlide?.name || '—'"
          />
        </div>
        <div class="return-counter">{{ slideIndex + 1 }} / {{ totalSlides || 0 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useProjectionState } from "@/composables/useProjectionState";
import { useSlideStyle } from "@/composables/useSlideStyle";

const { t } = useI18n();
const { slide, isCover, progress, title, slideIndex, totalSlides, nextSlide } =
  useProjectionState();
const slideStyle = useSlideStyle();

const ready = ref(false);

// Reusa coverStyle / lyricStyle do composable, com tamanhos menores
// para o stage display (Return é menor que Projection fullscreen).
const textStyle = computed(() => {
  const base = isCover.value
    ? slideStyle.coverStyle(slide.value)
    : slideStyle.lyricStyle(slide.value);
  // Ajuste para o painel de retorno (font menor, mantém cores e família).
  return {
    ...base,
    fontSize: `clamp(24px, ${isCover.value ? 14 : 11}vh, 160px)`,
  };
});

onMounted(() => {
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "#293329";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready.value = true;
    });
  });
});
</script>

<style scoped>
.return-root,
.return-root :deep(*) {
  cursor: none;
}

.return-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #293329; /* Cor exata do fmMusicaRetorno Delphi */
  font-family: var(--lj-font-projection);
  opacity: 0;
  transition: opacity 256ms linear;
}
.return-root--ready {
  opacity: 1;
}

/* Painel atual (alClient) */
.return-current {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #1a201a;
}

.return-bg {
  position: absolute;
  inset: 0;
  opacity: 0.7;
}

.return-current-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 40px 80px;
}

.return-text {
  text-align: center;
  line-height: 1.3;
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.01em;
  max-width: 92vw;
  color: #fff;
}

.return-text--cover {
  letter-spacing: 0.02em;
}

.return-title {
  position: absolute;
  top: 12px;
  left: 16px;
  right: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #efb400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.return-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.return-progress-fill {
  height: 100%;
  background: #efb400;
  transition: width 0.6s linear;
}

/* Painel inferior (alBottom Delphi: 39px) com próximo slide */
.return-bottom {
  flex: 0 0 auto;
  height: 17vh;
  min-height: 100px;
  background: linear-gradient(180deg, #1d251d, #131b13);
  border-top: 2px solid #efb400;
  display: flex;
  align-items: center;
  padding: 8px 16px;
}

.return-bottom-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  width: 100%;
  align-items: center;
}

.return-next-text {
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
}

.return-next-label {
  font-size: 1.4vh;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #efb400;
  background: rgba(239, 180, 0, 0.12);
  border: 1px solid rgba(239, 180, 0, 0.4);
  padding: 4px 10px;
  border-radius: 2px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.return-next-content {
  font-size: clamp(14px, 5vh, 60px);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.return-counter {
  font-size: clamp(18px, 4vh, 48px);
  font-weight: 700;
  color: #efb400;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  padding-left: 12px;
  border-left: 1px solid rgba(239, 180, 0, 0.3);
}
</style>
