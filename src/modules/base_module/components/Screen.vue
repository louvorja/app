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
      {{ time }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import manifest from "../manifest.json";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";

const container = ref(null);
const sWidth = ref(0);
const sHeight = ref(0);
let timer = null;
const time = ref(null);

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

const backgroundColor = computed(() => userdata.value.background_color || "#000000");
const font = computed(() => userdata.value.font || "Arial, sans-serif");
const fontColor = computed(() => userdata.value.font_color || "#FFFFFF");
const fontSize = computed(() => userdata.value.font_size || 30);
const borderSpacing = computed(() => userdata.value.border_spacing || 10);
const verticalAlign = computed(() => userdata.value.vertical_align || "center");
const horizontalAlign = computed(() => userdata.value.horizontal_align || "center");
const hourCycle = computed(() => userdata.value.hour_cycle || "24h");
const timeFormat = computed(() => userdata.value.time_format || "hh:mm:ss");

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

function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const is12Hour = hourCycle.value === "12h";
  const displayHours = is12Hour && hours > 12 ? hours - 12 : is12Hour && hours === 0 ? 12 : hours;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const pad = (v) => String(v).padStart(2, "0");
  const tokens = { hh: pad(displayHours), mm: pad(minutes), ss: pad(seconds) };
  let timeStr = timeFormat.value.replace(/hh|mm|ss/g, (match) => tokens[match]);
  if (is12Hour) timeStr += hours >= 12 ? " PM" : " AM";
  time.value = timeStr;
}

onMounted(() => {
  windowResize();
  window.addEventListener("resize", windowResize);
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  window.removeEventListener("resize", windowResize);
  clearInterval(timer);
});
</script>
