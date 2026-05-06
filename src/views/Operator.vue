<template>
  <div
    ref="root"
    class="op-root"
    role="application"
    :aria-label="t('shell.operator_label')"
    tabindex="0"
  >
    <!-- Header -->
    <div class="op-header">
      <span class="op-title">{{ title || "—" }}</span>
      <span class="op-hint">{{ t("shell.operator_hint") }}</span>
    </div>

    <!-- Grade de slides -->
    <div v-if="slides.length === 0" class="op-empty">{{ t("shell.operator_waiting") }}</div>

    <div v-else class="op-grid" role="grid">
      <div
        v-for="(slide, i) in slides"
        :key="i"
        class="op-card"
        role="gridcell"
        :aria-label="t('shell.operator_slide_label', { n: i + 1, total: slides.length })"
        :aria-selected="i === currentIndex"
        :class="{
          'op-card--active': i === currentIndex,
          'op-card--cover': slide.cover,
        }"
        :style="{ backgroundImage: slide.url_image ? `url(${slide.url_image})` : 'none' }"
        @click="goTo(i)"
      >
        <div class="op-card-num">{{ i + 1 }}</div>
        <div class="op-card-text" v-html="slide.lyric || slide.name || '—'" />
      </div>
    </div>

    <!-- Barra de progresso -->
    <div class="op-progress-bar">
      <div class="op-progress-fill" :style="{ width: progress + '%' }" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";
import { useBroadcastListener } from "@/composables/useBroadcastListener";

const { t } = useI18n();
const root = ref(null);
const slides = ref([]);
const currentIndex = ref(0);
const title = ref("");
const progress = ref(0);

useBroadcastListener(BROADCAST_TYPE.SLIDES_DATA, (payload) => {
  slides.value = payload.slides || [];
  title.value = payload.title || "";
  currentIndex.value = payload.slide_index ?? 0;
});

useBroadcastListener(BROADCAST_TYPE.SLIDE_CHANGE, (payload) => {
  currentIndex.value = payload.slide_index ?? 0;
  progress.value = payload.progress ?? 0;
  if (payload.title) title.value = payload.title;
});

// Scroll para o card ativo após qualquer mudança de currentIndex originada
// por slide_change (navegação externa) ou por goTo() (teclado/clique).
watch(currentIndex, () => scrollToActive(), { flush: "post" });

function goTo(index) {
  currentIndex.value = index;
  $broadcast.send(BROADCAST_TYPE.GO_TO_SLIDE, { index });
}

function onKey(e) {
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    if (currentIndex.value < slides.value.length - 1) goTo(currentIndex.value + 1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    if (currentIndex.value > 0) goTo(currentIndex.value - 1);
  } else if (e.key === "Home") {
    e.preventDefault();
    goTo(0);
  } else if (e.key === "End") {
    e.preventDefault();
    goTo(slides.value.length - 1);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    goTo(currentIndex.value);
  } else if (e.key === "Escape") {
    e.preventDefault();
    window.close();
  }
}

function scrollToActive() {
  nextTick(() => {
    const active = root.value?.querySelector(".op-card--active");
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

onMounted(() => {
  document.body.style.margin = "0";
  root.value?.focus();
  // Captura setas globalmente — sem depender do foco do root
  window.addEventListener("keydown", onKey);
  // Solicita estado atual (caso a música já tenha aberto antes desta janela)
  $broadcast.send(BROADCAST_TYPE.REQUEST_SLIDE_STATE);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
});
</script>

<style>
/* Cores Delphi do fmMusicaOperador: panel #353535, grid lines #524752 */
body {
  margin: 0;
  background: #232323;
  color: #fff;
  font-family: var(--lj-font-projection);
}
</style>
<style scoped>
.op-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #232323;
  outline: none;
  font-family: var(--lj-font-projection);
}
.op-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #353535;
  border-bottom: 1px solid #524752;
  flex-shrink: 0;
}
.op-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #efb400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.op-hint {
  font-size: 0.75rem;
  color: #888;
  white-space: nowrap;
  letter-spacing: 0.05em;
}
.op-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.op-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 6px;
  padding: 10px;
  overflow-y: auto;
  align-content: start;
  background: #232323;
}
.op-card {
  position: relative;
  aspect-ratio: 16/9;
  background: #1a1a1a;
  border: 2px solid #524752;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-size: cover;
  background-position: center;
  transition:
    border-color 0.12s,
    transform 0.08s;
}
.op-card:hover {
  border-color: #efb400;
  transform: scale(1.015);
}
.op-card--active {
  border-color: #efb400;
  box-shadow:
    0 0 0 2px rgba(239, 180, 0, 0.4),
    inset 0 0 0 1px rgba(239, 180, 0, 0.2);
}
.op-card--cover {
  background: #1a1a1a;
}
.op-card-num {
  position: absolute;
  top: 3px;
  left: 5px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.55);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
}
.op-card-text {
  font-size: 0.85rem;
  color: #fff;
  text-align: center;
  line-height: 1.25;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  max-height: 100%;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.op-card--active .op-card-text {
  color: #efb400;
}
.op-card--active.op-card--cover .op-card-text {
  color: #efb400;
}
.op-card--cover:not(.op-card--active) .op-card-text {
  color: #efb400;
}
.op-progress-bar {
  height: 3px;
  background: #353535;
  flex-shrink: 0;
}
.op-progress-fill {
  height: 100%;
  background: #efb400;
  transition: width 0.5s linear;
}
</style>
