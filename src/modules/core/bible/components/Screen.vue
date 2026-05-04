<template>
  <div
    ref="container"
    :class="['d-flex', `align-${userdata.vertical_align}`, `justify-${userdata.horizontal_align}`]"
    :style="{
      position: 'relative',
      background: userdata.background_color,
      width: '100%',
      height: height ? height + 'px' : '100%',
      padding: `${fontSizePc(userdata.border_spacing)}px`,
    }"
  >
    <img
      v-if="userdata.image"
      :src="userdata.image"
      alt=""
      loading="eager"
      :style="{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        objectFit: userdata.image_fit,
        opacity: userdata.image_opacity / 100,
      }"
    />

    <div v-if="bible" class="d-flex flex-column">
      <span
        v-if="bible.text"
        :class="
          'text-' +
          (userdata.horizontal_align == 'start'
            ? 'left'
            : userdata.horizontal_align == 'end'
              ? 'right'
              : 'center')
        "
        :style="{
          zIndex: 1,
          color: userdata.font_color,
          fontSize: `${fontSizePc(userdata.font_size)}px`,
          fontFamily: userdata.font || 'Arial, sans-serif',
        }"
      >
        {{ bible.text }}
      </span>
      <span
        v-if="bible.scriptural_reference"
        :class="'text-' + (userdata.horizontal_align == 'start' ? 'left' : 'right')"
        :style="{
          zIndex: 1,
          color: userdata.reference_font_color,
          fontSize: `${fontSizePc(userdata.reference_font_size)}px`,
          fontFamily: userdata.reference_font || 'Arial, sans-serif',
        }"
      >
        {{ bible.scriptural_reference }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import manifest from "../manifest.json";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";

defineProps({
  height: Number,
});

const container = ref(null);
const sWidth = ref(0);
const sHeight = ref(0);

const module_ = computed(() => Modules.get(manifest.id));

const userdata = computed(
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => UserData.get(`modules.${module_.value.id}.${key}`, null),
        set: (_, key, value) => {
          UserData.set(`modules.${module_.value.id}.${key}`, value);
          return true;
        },
      }
    )
);

const bible = computed(() => AppData.get("modules.bible.data"));

function fontSizePc(pc) {
  const v = Math.min(sWidth.value, sHeight.value);
  return (pc * v) / 100 / 2;
}

function windowResize() {
  const el = container.value;
  if (el) {
    sWidth.value = el.offsetWidth;
    sHeight.value = el.offsetHeight;
    if (sWidth.value <= 0 || sHeight.value <= 0) {
      setTimeout(windowResize, 100);
    }
  }
}

onMounted(() => {
  windowResize();
  window.addEventListener("resize", windowResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", windowResize);
});
</script>
