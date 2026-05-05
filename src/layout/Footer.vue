<template>
  <footer id="footer-bar" class="footer" :class="{ 'footer--player': hasPlayer }">
    <!-- Modo Player Delphi-style -->
    <div v-if="hasPlayer" class="player">
      <div class="player-title">
        <v-icon icon="mdi-music" size="14" class="player-title-icon" />
        <span class="player-title-text lj-u-truncate">
          {{ $t("shell.playing") }}: {{ playerTitle }}
        </span>
      </div>

      <div class="player-row">
        <div class="player-controls">
          <button
            type="button"
            class="player-btn"
            :title="$t('shell.player.first')"
            :disabled="!canPrev"
            @click="firstSlide()"
          >
            <v-icon icon="mdi-skip-previous" size="22" />
          </button>
          <button
            type="button"
            class="player-btn"
            :title="$t('shell.player.prev')"
            :disabled="!canPrev"
            @click="prevSlide()"
          >
            <v-icon icon="mdi-chevron-left" size="22" />
          </button>
          <button
            v-if="hasAudio"
            type="button"
            class="player-btn player-btn--primary"
            :title="isPaused ? $t('shell.player.play') : $t('shell.player.pause')"
            @click="togglePlay"
          >
            <v-icon :icon="isPaused ? 'mdi-play' : 'mdi-pause'" size="24" />
          </button>
          <button
            type="button"
            class="player-btn"
            :title="$t('shell.player.next')"
            :disabled="!canNext"
            @click="nextSlide()"
          >
            <v-icon icon="mdi-chevron-right" size="22" />
          </button>
          <button
            type="button"
            class="player-btn"
            :title="$t('shell.player.last')"
            :disabled="!canNext"
            @click="lastSlide()"
          >
            <v-icon icon="mdi-skip-next" size="22" />
          </button>
          <span class="player-divider" />
          <button
            type="button"
            class="player-btn player-btn--close"
            :title="$t('shell.player.close')"
            @click="closeMedia()"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </div>

        <div v-if="!hasAudio" class="player-slide-text" v-html="slideText" />

        <div class="player-meta">
          <span v-if="hasAudio" class="player-time">
            {{ shortTime(currentTime) }}
            <span class="player-time-sep">/</span>
            {{ shortTime(duration) }}
          </span>
          <span class="player-counter">{{ slideIndex + 1 }} / {{ totalSlides }}</span>
          <button
            type="button"
            class="player-btn player-btn--small"
            :title="$t('shell.player.maximize')"
            @click="maximizeMedia()"
          >
            <v-icon icon="mdi-open-in-app" size="16" />
          </button>
          <button
            type="button"
            class="player-btn player-btn--small"
            :title="$t('shell.player.fullscreen')"
            @click="fullscreenMedia()"
          >
            <v-icon icon="mdi-fullscreen" size="16" />
          </button>
        </div>
      </div>

      <div
        class="player-gauge"
        :class="{ 'player-gauge--audio': hasAudio }"
        @click="onTimelineClick"
      >
        <div class="player-gauge-buffer" :style="{ width: bufferPct + '%' }" />
        <div
          class="player-gauge-fill"
          :class="{
            'player-gauge-fill--paused': isPaused,
            'player-gauge-fill--mute': isMute,
          }"
          :style="{ width: progress + '%' }"
        />
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import packageJson from "@root/package.json";
import Modules from "@/helpers/Modules";
import Media from "@/composables/useMedia";
import Database from "@/helpers/Database";
import DateTime from "@/helpers/DateTime";

const dbVersion = ref(0);

const version = computed(() => `${packageJson.version}.${dbVersion.value}`);
const media = computed(() => Modules.get("media"));

const hasPlayer = computed(() => {
  try {
    return !!Media.isMinimized();
  } catch (_) {
    return false;
  }
});

const hasAudio = computed(() => {
  const url = media.value?.config?.audio;
  return typeof url === "string" && url !== "";
});

const isPaused = computed(() => media.value?.config?.is_paused !== false);
const isMute = computed(() => Number(media.value?.config?.volume) <= 0);
const progress = computed(() => Number(media.value?.config?.progress) || 0);
const bufferPct = computed(() => Number(media.value?.config?.buffered) || 0);
const currentTime = computed(() => media.value?.config?.current_time || 0);
const duration = computed(() => media.value?.config?.duration || 0);
const slideIndex = computed(() => media.value?.config?.slide_index ?? 0);
const totalSlides = computed(() => media.value?.config?.last_slide ?? 0);
const canPrev = computed(() => slideIndex.value > 0);
const canNext = computed(() => slideIndex.value < totalSlides.value - 1);

const playerTitle = computed(() => {
  const c = media.value?.config;
  if (!c) return "—";
  let s = c.title || "—";
  if (c.subtitle) s += " · " + c.subtitle;
  if (c.track > 0) s += "  ·  faixa " + c.track;
  return s;
});

const slideText = computed(() => {
  try {
    const slides = Media.slides();
    const slide = slides?.[slideIndex.value];
    if (!slide?.lyric) return "";
    return slide.lyric.replace(/<br>/gi, " / ").toUpperCase();
  } catch (_) {
    return "";
  }
});

const shortTime = (t) => DateTime.shortTime(t);
const firstSlide = () => Media.firstSlide();
const prevSlide = () => Media.prevSlide();
const nextSlide = () => Media.nextSlide();
const lastSlide = () => Media.lastSlide();
const closeMedia = () => Media.close();
const maximizeMedia = () => Media.maximize();
const fullscreenMedia = () => Media.fullscreen(true);

function togglePlay() {
  if (isPaused.value) Media.play();
  else Media.pause();
}

function onTimelineClick(e) {
  if (!hasAudio.value || !duration.value) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  const time = duration.value * Math.max(0, Math.min(1, ratio));
  Media.goToTime(time);
}

async function loadDBVersion() {
  try {
    const config = await Database.get("config");
    dbVersion.value = config?.version_number ?? "?";
  } catch (_) {
    dbVersion.value = "?";
  }
}

onMounted(loadDBVersion);
</script>

<style scoped>
.footer {
  background: var(--lj-footer-bg);
  border-top: 1px solid var(--lj-footer-border);
  flex-grow: 0;
  flex-shrink: 0;
  user-select: none;
  font-family: var(--lj-font-shell);
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Footer só aparece quando há player ativo (sem player = display:none, sem ocupar espaço) */
.footer:not(.footer--player) {
  display: none;
}

.footer--player {
  height: var(--lj-player-height);
}

/* Player */
.player {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.player-title {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  height: var(--lj-player-title-height);
  padding: 0 var(--lj-space-5);
  background: var(--lj-tabs-bg);
  color: var(--lj-text-on-navy);
  border-bottom: 1px solid var(--lj-footer-border);
  font-size: var(--lj-text-sm);
  flex-shrink: 0;
  font-weight: var(--lj-weight-medium);
}

.player-title-icon {
  opacity: 0.85;
  flex-shrink: 0;
}

.player-title-text {
  letter-spacing: 0.02em;
}

.player-row {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 var(--lj-space-4);
  gap: var(--lj-space-5);
  overflow: hidden;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: var(--lj-space-1);
  flex-shrink: 0;
}

.player-btn {
  width: var(--lj-player-btn-width);
  height: var(--lj-player-btn-height);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  color: var(--lj-text);
  cursor: pointer;
  border-radius: var(--lj-radius-xs);
  transition:
    background var(--lj-transition-fast),
    border-color var(--lj-transition-fast);
  outline: none;
  font-family: inherit;
}

.player-btn:hover:not(:disabled) {
  background: var(--lj-hover-bg);
  border-color: var(--lj-surface-border-strong);
}

.player-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.player-btn--primary {
  width: var(--lj-player-btn-primary-width);
  background: var(--lj-navy);
  color: var(--lj-white);
  border-color: color-mix(in srgb, var(--lj-navy) 70%, black);
}

.player-btn--primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--lj-navy) 90%, white 10%);
}

.player-btn--close {
  color: var(--lj-danger-dark);
}
.player-btn--close:hover {
  background: var(--lj-danger-soft);
  border-color: var(--lj-danger-border);
  color: var(--lj-danger);
}

.player-btn--small {
  width: 28px;
  height: 28px;
}

.player-divider {
  width: 1px;
  height: 24px;
  margin: 0 var(--lj-space-3);
  background: var(--lj-divider);
}

.player-slide-text {
  flex: 1;
  font-size: var(--lj-text-base);
  font-weight: var(--lj-weight-semibold);
  letter-spacing: 0.04em;
  color: var(--lj-player-slide-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  font-family: var(--lj-font-projection);
  text-transform: uppercase;
}

.player-meta {
  display: flex;
  align-items: center;
  gap: var(--lj-space-4);
  flex-shrink: 0;
  margin-left: auto;
  font-size: var(--lj-text-base);
  color: var(--lj-text-muted);
}

.player-time {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
  font-weight: var(--lj-weight-medium);
}

.player-time-sep {
  margin: 0 var(--lj-space-2);
  opacity: 0.5;
}

.player-counter {
  font-variant-numeric: tabular-nums;
  font-weight: var(--lj-weight-semibold);
  background: var(--lj-hover-bg);
  padding: 2px var(--lj-space-4);
  border-radius: var(--lj-radius-xs);
  min-width: 50px;
  text-align: center;
}

/* Timeline gauge */
.player-gauge {
  height: var(--lj-player-gauge-height);
  position: relative;
  background: var(--lj-player-gauge-bg);
  border-top: 1px solid var(--lj-footer-border);
  cursor: default;
  overflow: hidden;
  flex-shrink: 0;
}

.player-gauge--audio {
  cursor: pointer;
}

.player-gauge-buffer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: var(--lj-player-gauge-buffer-bg);
  transition: width 0.3s linear;
}

.player-gauge-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(180deg, var(--lj-color-cover-gold), var(--lj-color-cover-gold-dark));
  transition: width 0.4s linear;
  box-shadow: 0 0 8px var(--lj-gold-alpha-60);
}

.player-gauge-fill--paused {
  background: linear-gradient(180deg, var(--lj-warning), var(--lj-warning-dark));
  box-shadow: none;
}

.player-gauge-fill--mute {
  background: linear-gradient(180deg, var(--lj-danger), var(--lj-danger-dark));
  box-shadow: none;
}
</style>
