<template>
  <div class="obs-bible-root">
    <Transition name="fade-verse" mode="out-in">
      <div v-if="active && text" :key="text" class="obs-bible-content">
        <div class="obs-bible-text">{{ text }}</div>
        <div class="obs-bible-reference">{{ reference }}</div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";
import { useBroadcastListener } from "@/composables/useBroadcastListener";

const text = ref("");
const reference = ref("");
const active = ref(false);

useBroadcastListener(BROADCAST_TYPE.BIBLE_VERSE, (payload) => {
  text.value = payload.text || "";
  reference.value = payload.reference || "";
  active.value = payload.active ?? true;
});

onMounted(() => {
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.background = "transparent";
});
</script>

<style>
body {
  margin: 0;
  overflow: hidden;
  background: transparent;
}
</style>
<style scoped>
.obs-bible-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 40px;
  box-sizing: border-box;
  background: transparent;
}
.obs-bible-content {
  background: rgba(0, 0, 0, 0.82);
  border-left: 4px solid #6366f1;
  border-radius: 4px;
  padding: 20px 28px;
  max-width: 860px;
  width: 100%;
}
.obs-bible-text {
  font-size: clamp(1.1rem, 2.5vw, 1.6rem);
  font-weight: 300;
  color: #f1f5f9;
  line-height: 1.5;
  white-space: pre-wrap;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}
.obs-bible-reference {
  margin-top: 8px;
  font-size: clamp(0.8rem, 1.5vw, 1rem);
  color: #818cf8;
  font-weight: 500;
  letter-spacing: 0.03em;
}

/* Transição */
.fade-verse-enter-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-verse-leave-active {
  transition: opacity 0.25s ease;
}
.fade-verse-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-verse-leave-to {
  opacity: 0;
}
</style>
