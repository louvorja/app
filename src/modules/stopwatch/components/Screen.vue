<template>
  <div ref="container" class="d-flex" :class="alignClass" :style="containerStyle">
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
    <span class="text-right" :style="textStyle">
      {{ formattedTime }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import manifest from "../manifest.json";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";
import AppData from "@/helpers/AppData";

const container = ref(null);
const sWidth = ref(0);
const sHeight = ref(0);
let timer = null;
const now = ref(null);

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

const appdata = computed(
  () =>
    new Proxy(
      {},
      {
        get: (_, key) => AppData.get(`modules.${module_.value.id}.${key}`, null),
        set: (_, key, value) => {
          AppData.set(`modules.${module_.value.id}.${key}`, value);
          return true;
        },
      }
    )
);

const backgroundColor = computed(() => userdata.value.background_color || "#000000");
const font = computed(() => userdata.value.font || "Arial, sans-serif");
const fontColor = computed(() => userdata.value.font_color || "#FFFFFF");
const fontSize = computed(() => userdata.value.font_size || 30);
const borderSpacing = computed(() => userdata.value.border_spacing || 10);
const verticalAlign = computed(() => userdata.value.vertical_align || "center");
const horizontalAlign = computed(() => userdata.value.horizontal_align || "center");
const timeFormat = computed(() => userdata.value.time_format || "hh.mm.ss.ms");

const startTime = computed(() => {
  const value = appdata.value.start_time;
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
});
const pausedTime = computed(() => {
  const value = appdata.value.paused_time;
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
});
const isRunning = computed(() => appdata.value.is_running ?? null);

const alignClass = computed(() => {
  const vertical = { start: "align-start", center: "align-center", end: "align-end" };
  const horizontal = { start: "justify-start", center: "justify-center", end: "justify-end" };
  return `${vertical[verticalAlign.value]} ${horizontal[horizontalAlign.value]}`;
});

const containerStyle = computed(() => ({
  background: backgroundColor.value,
  width: "100%",
  height: "100%",
  position: "relative",
  color: fontColor.value,
  padding: `${borderSpacing.value}px`,
}));

const textStyle = computed(() => ({
  fontFamily: font.value,
  color: fontColor.value,
  zIndex: 1,
  fontSize: `${fontSizePc(fontSize.value)}px`,
  textAlign: horizontalAlign.value,
}));

const formattedTime = computed(() => {
  const elapsed = now.value ? now.value - (startTime.value ?? now.value) : 0;
  const totalMs = elapsed;
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = Math.floor((totalMs % 1000) / 10);
  const pad = (v) => String(v).padStart(2, "0");
  const tokens = { hh: pad(hours), mm: pad(minutes), ss: pad(seconds), ms: pad(milliseconds) };
  return timeFormat.value.replace(/hh|mm|ss|ms/g, (match) => tokens[match]);
});

watch(isRunning, (running) => {
  if (running) {
    timer = setInterval(() => {
      now.value = new Date();
    }, 10);
  } else {
    clearInterval(timer);
    now.value = pausedTime.value;
  }
});

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
  if (isRunning.value) {
    timer = setInterval(() => {
      now.value = new Date();
    }, 10);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", windowResize);
  clearInterval(timer);
});
</script>
