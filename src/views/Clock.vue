<template>
  <div class="clock-fullscreen">
    <div class="clock-time">{{ time }}</div>
    <div class="clock-date">{{ date }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const time = ref("");
const date = ref("");
const timer = ref(null);
const show24h = ref(true);
const showSeconds = ref(true);

function _onKey(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    window.close();
  }
}

function tick() {
  const now = new Date();
  time.value = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds.value ? { second: "2-digit" } : {}),
    hour12: !show24h.value,
  });
  date.value = now.toLocaleDateString([], {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  show24h.value = params.get("h24") !== "0";
  showSeconds.value = params.get("sec") !== "0";
  tick();
  timer.value = setInterval(tick, 1000);
  window.addEventListener("keydown", _onKey);
});

onBeforeUnmount(() => {
  clearInterval(timer.value);
  window.removeEventListener("keydown", _onKey);
});
</script>

<style scoped>
.clock-fullscreen {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: none;
}
.clock-time {
  font-size: clamp(4rem, 18vw, 16rem);
  font-weight: 200;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  color: #fff;
  line-height: 1;
}
.clock-date {
  font-size: clamp(1rem, 3vw, 2.5rem);
  font-weight: 300;
  color: rgba(255, 255, 255, 0.6);
  text-transform: capitalize;
  letter-spacing: 0.05em;
}
</style>
