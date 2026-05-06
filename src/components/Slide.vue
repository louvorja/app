<template>
  <div
    class="lj-slide"
    :class="[`lj-slide--align-${cfg.text_align}`, { 'lj-slide--ready': ready }]"
    :style="rootStyle"
  >
    <!-- Fundo (cor + imagem). Só pinta se houver imagem ou cor diferente do
         padrão; senão fica transparente sobre o root. -->
    <div
      v-if="bgStyle.backgroundImage || cfg.background_color"
      :key="bgKey"
      class="lj-slide__bg"
      :style="bgStyle"
    />

    <!-- Título no primeiro slide (configurável via show_title_first_slide).
         Exibe o título da música sobre a capa, em pequeno, no topo. -->
    <div v-if="cfg.show_title_first_slide && isCover && title" class="lj-slide__title-top">
      {{ title }}
    </div>

    <!-- Texto principal (capa OU letra) -->
    <div class="lj-slide__content">
      <div
        v-if="mainText"
        class="lj-slide__text"
        :class="[
          isCover ? 'lj-slide__text--cover' : 'lj-slide__text--lyric',
          { 'lj-slide__text--repeat': isRepeat },
        ]"
        :style="mainTextStyle"
        v-html="mainText"
      />
    </div>

    <!-- Texto auxiliar (lblLetra_aux Delphi) -->
    <div v-if="auxText" class="lj-slide__content lj-slide__content--aux">
      <div class="lj-slide__text lj-slide__text--aux" :style="auxTextStyle" v-html="auxText" />
    </div>

    <!-- Barra de progresso inferior (espelha Projection) -->
    <div
      v-if="showProgress && cfg.show_progress_bar"
      class="lj-slide__progress"
      :style="{ width: progress + '%', background: cfg.progress_color }"
    />
  </div>
</template>

<script setup>
/**
 * Slide.vue — Renderizador canônico de slides do LouvorJA.
 *
 * Usado por:
 *   - Projection.vue          (janela de projeção fullscreen)
 *   - ProjectionReturn.vue    (stage display) — futuramente
 *   - modules/media/Index.vue (preview dentro da janela do media)
 *   - modules/media/Popup.vue (popup auxiliar)
 *
 * API uniforme: aceita `slide` (objeto com lyric/aux_lyric/url_image/cover/
 * image_position) e `title` (string da música, para o título do topo da capa).
 *
 * Tamanho dos textos: usa `cqh` (% da altura DESTE container) — automaticamente
 * ajusta tanto pra fullscreen (Projection) quanto pra preview menor (Slide
 * dentro do v-dialog do media). Sem multiplicadores arbitrários: o cfg.font_size_*
 * é a proporção direta.
 *
 * Fundo, cores, fontes, alinhamento, transparência da caixa de texto, refrão
 * com cor própria — tudo lido de useSlideStyle (única fonte de verdade).
 */
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import Strings from "@/helpers/Strings";
import Path from "@/helpers/Path";
import { useSlideStyle } from "@/composables/useSlideStyle";

/** Resolve url_image: passa caminho relativo pra Path.file; absoluto retorna como-está. */
function _resolveImage(url) {
  if (!url) return null;
  if (typeof url !== "string") return null;
  // Já é URL absoluta (http/https/louvorja/file/data)?
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url) || url.startsWith("data:")) return url;
  try {
    return Path.file(url);
  } catch {
    return url;
  }
}

const props = defineProps({
  /** Objeto do slide (lyric, aux_lyric, url_image, image_position, cover, color, font, font_size_pct, ...) */
  slide: { type: Object, default: null },
  /** Título da música (exibido no topo da capa quando show_title_first_slide=true) */
  title: { type: String, default: "" },
  /** Progresso 0-100 da barra inferior. Ignorado se showProgress=false. */
  progress: { type: Number, default: 0 },
  /** Mostra a barra de progresso (default: false; Projection ativa). */
  showProgress: { type: Boolean, default: false },
  // ---- API legada por props (compatibilidade com chamadores antigos) ----
  text: { type: String, default: null },
  aux_text: { type: String, default: null },
  image: { type: String, default: null },
  image_position: { type: [Number, String], default: null },
  cover: { type: Boolean, default: null },
});

const slideStyle = useSlideStyle();
const cfg = slideStyle.cfg;

// Slide normalizado: combina API nova (props.slide) com a legada (props.text etc).
// Sempre resolve url_image — relativo (do banco) → URL completa (Path.file).
const slideObj = computed(() => {
  const src = props.slide
    ? props.slide
    : {
        lyric: props.text ?? "",
        aux_lyric: props.aux_text ?? "",
        url_image: props.image ?? null,
        image_position: props.image_position ?? null,
        cover: props.cover === true,
      };
  return { ...src, url_image: _resolveImage(src.url_image) };
});

const isCover = computed(() => slideObj.value?.cover === true);
const mainText = computed(() => slideObj.value?.lyric || slideObj.value?.name || "");
const auxText = computed(() => slideObj.value?.aux_lyric || slideObj.value?.lyric_aux || "");

// Detecta refrão repetido (mesmo conteúdo do slide anterior → cor alterna).
const isRepeat = ref(false);
let _last = { text: "", aux: "", img: "", cover: false };
watch(
  () => ({
    text: mainText.value,
    aux: auxText.value,
    img: slideObj.value?.url_image,
    cover: isCover.value,
  }),
  (next) => {
    const same =
      Strings.clean(_last.text) === Strings.clean(next.text) &&
      Strings.clean(_last.aux) === Strings.clean(next.aux) &&
      _last.img === next.img &&
      _last.cover === next.cover;
    isRepeat.value = same ? !isRepeat.value : false;
    _last = { ...next };
  }
);

// Estilos derivados — todos via useSlideStyle (fonte única).
const bgStyle = computed(() => slideStyle.bgStyle(slideObj.value));
const bgKey = computed(() => slideObj.value?.url_image || cfg.value.background_image || "default");

const mainTextStyle = computed(() => {
  const base = isCover.value
    ? slideStyle.coverStyle(slideObj.value)
    : slideStyle.lyricStyle(slideObj.value);
  const box = slideStyle.textBoxStyle();
  // Override de cor pra refrão (apenas em letras, não na capa)
  const out = { ...base, ...box };
  if (!isCover.value && isRepeat.value) {
    out.color = slideStyle.repeatColor();
  }
  // O fontSize do useSlideStyle vem em vh — substituímos por cqh via CSS
  // (mais correto pro preview menor). Removemos o inline pra não sobrepor o
  // CSS class .lj-slide__text--cover/lyric.
  delete out.fontSize;
  return out;
});

const auxTextStyle = computed(() => {
  const out = { ...slideStyle.auxStyle(slideObj.value), ...slideStyle.textBoxStyle() };
  delete out.fontSize;
  return out;
});

// CSS vars consumidas pelas classes .lj-slide__text--*
const rootStyle = computed(() => ({
  ...slideStyle.rootStyle.value,
  "--lj-cover-size": cfg.value.font_size_cover,
  "--lj-lyric-size": cfg.value.font_size_lyric,
  "--lj-aux-size": cfg.value.font_size_aux,
}));

// Fade-in da preview ao montar (espelha o AlphaBlend do fmMusica Delphi)
const ready = ref(false);
onMounted(() => {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ready.value = true;
    })
  );
});
onUnmounted(() => {
  ready.value = false;
});
</script>

<style scoped>
.lj-slide,
.lj-slide :deep(*) {
  user-select: none;
}

.lj-slide {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--lj-font-projection);
  background: #000;
  opacity: 0;
  /* Fade-in rápido (120ms) — antes 256ms herdado do AlphaBlend Delphi soava
     arrastado pra UX moderna. */
  transition: opacity 120ms linear;
  /* container queries → cqh = % da altura deste elemento.
     Quando Slide está em fullscreen (Projection), cqh ~ vh. Quando está num
     preview menor, cqh acompanha o container — mesma proporção visual. */
  container-type: size;
  container-name: lj-slide;
}

.lj-slide--ready {
  opacity: 1;
}

.lj-slide__bg {
  position: absolute;
  inset: 0;
}

.lj-slide__title-top {
  position: absolute;
  top: 2cqh;
  left: 0;
  right: 0;
  text-align: center;
  font-size: clamp(12px, 2.4cqh, 28px);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  z-index: 1;
  padding: 0 1em;
}

.lj-slide__content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4cqw;
}

.lj-slide--align-top .lj-slide__content {
  align-items: flex-start;
  padding-top: 8cqh;
}

.lj-slide--align-bottom .lj-slide__content {
  align-items: flex-end;
  padding-bottom: 8cqh;
}

.lj-slide__content--aux {
  align-items: flex-start;
  padding-top: 6cqh;
}

.lj-slide__text {
  letter-spacing: 0.01em;
  text-transform: uppercase;
  text-align: center;
  font-weight: 700;
  line-height: 1.25;
  text-shadow:
    0 2px 12px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(0, 0, 0, 0.6);
  padding: 0 0.4em;
  max-width: 92cqw;
}

.lj-slide__text--cover {
  font-size: clamp(20px, calc(var(--lj-cover-size, 18) * 1cqh), 220px);
  letter-spacing: 0.02em;
}

.lj-slide__text--lyric {
  font-size: clamp(18px, calc(var(--lj-lyric-size, 14) * 1cqh), 200px);
  font-weight: 600;
}

.lj-slide__text--aux {
  font-size: clamp(14px, calc(var(--lj-aux-size, 8) * 1cqh), 120px);
  font-weight: 600;
  opacity: 0.95;
}

.lj-slide__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  transition: width 0.6s linear;
}
</style>
