<template>
  <div ref="container" class="w-100 h-100">
    <transition v-for="(slide, index) in slides.slice().reverse()" :key="index" name="fade">
      <div
        v-if="!slide.destroy"
        v-show="slide.active"
        class="position-absolute top-0 left-0 w-100 h-100"
        :style="style_bg(slide)"
      >
        <div class="position-absolute top-0 left-0 w-100 h-100 d-flex justify-center align-center">
          <div>
            <div v-if="slide.aux_text" :style="style_aux_text()" v-html="slide.aux_text" />
            <div v-if="slide.text" :style="style_text(slide)" v-html="slide.text" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import Strings from "@/helpers/Strings";
import { useSlideStyle } from "@/composables/useSlideStyle";

const { cfg, repeatColor, textBoxStyle } = useSlideStyle();

const props = defineProps({
  slide_number: Number,
  cover: Boolean,
  text: String,
  aux_text: String,
  image: String,
  image_position: Number,
});

const container = ref(null);
const slides = ref([{}, {}]);
const repeat = ref(false);
const width = ref(0);
const height = ref(0);

const props_slide = computed(() => ({
  slide_number: props.slide_number,
  cover: props.cover,
  text: props.text,
  aux_text: props.aux_text,
  image: props.image,
  image_position: props.image_position,
}));

const screenSize = computed(() => ({ width: width.value, height: height.value }));

watch(props_slide, () => setSlide());

watch(screenSize, () => {
  setTimeout(() => windowResize(), 100);
});

onMounted(() => {
  setSlide();
  windowResize();
  window.addEventListener("resize", windowResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", windowResize);
});

function setSlide() {
  const current = slides.value[1];
  const next = props_slide.value;

  if (
    Strings.clean(current.text) == Strings.clean(next.text) &&
    Strings.clean(current.aux_text) == Strings.clean(next.aux_text) &&
    current.image == next.image &&
    current.cover == next.cover
  ) {
    repeat.value = !repeat.value;
  } else {
    repeat.value = false;
  }

  slides.value.unshift({});
  slides.value[1] = { ...next, active: true };

  if (slides.value.length > 3) {
    slides.value[3].destroy = true;
  }
}

function style_bg(slide) {
  // Imagem da capa: a do slide vence quando affect_external_slides=false.
  // Quando true, a config da Opções (background_image) força.
  const useCfgImage = cfg.value.affect_external_slides && cfg.value.background_image;
  const image = useCfgImage ? cfg.value.background_image : slide.image;
  return {
    overflow: "hidden",
    backgroundColor: cfg.value.background_color || "var(--lj-color-projection-bg)",
    backgroundImage: image ? `url(${image})` : undefined,
    backgroundRepeat: "no-repeat",
    backgroundPosition: useCfgImage
      ? cfg.value.background_position
      : [
          "top left",
          "top center",
          "top right",
          "center left",
          "center center",
          "center right",
          "bottom left",
          "bottom center",
          "bottom right",
        ][props.image_position || 5],
    backgroundSize: "cover",
  };
}

function style_aux_text() {
  return {
    ...textBoxStyle(),
    fontSize: `${fontSizePc(cfg.value.font_size_aux * 1.25)}px`,
    color: cfg.value.color_aux,
    padding: `0px ${fontSizePc(5)}px`,
    fontFamily: cfg.value.font || "var(--lj-font-projection)",
    textTransform: "uppercase",
  };
}

function style_text(slide) {
  const base = {
    ...textBoxStyle(),
    padding: `0px ${fontSizePc(5)}px`,
    textAlign: "center",
    fontFamily: cfg.value.font || "var(--lj-font-projection)",
    textTransform: "uppercase",
  };

  if (slide.cover) {
    return {
      ...base,
      fontSize: `${fontSizePc(cfg.value.font_size_cover * 1.4)}px`,
      color: cfg.value.color_cover,
    };
  }
  return {
    ...base,
    fontSize: `${fontSizePc(cfg.value.font_size_lyric * 1.4)}px`,
    color: repeat.value ? repeatColor() : cfg.value.color_lyric,
  };
}

function fontSizePc(pc) {
  const v = Math.min(width.value, height.value);
  return (pc * v) / 100 / 2;
}

function windowResize() {
  const el = container.value;
  if (el) {
    width.value = el.offsetWidth;
    height.value = el.offsetHeight;

    if (width.value <= 0 || height.value <= 0) {
      setTimeout(() => windowResize(), 100);
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
