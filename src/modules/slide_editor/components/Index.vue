<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :title="songTitle"
    :before-close="confirmDiscard"
    @close="onClose"
  >
    <template #header>
      <div class="se-statusbar-inline">
        <button class="se-rename-btn" :title="t('labels.name')" @click="renameSong">
          <v-icon size="14">mdi-pencil-outline</v-icon>
        </button>
        <span v-if="dirty" class="se-dirty-dot" :title="t('actions.save')">●</span>
        <span class="se-status-cell">
          <v-icon size="13">mdi-image</v-icon>
          <strong>{{ current + 1 }}</strong>
          /{{ slides.length }}
        </span>
        <span v-if="activeSlide.tempo_seconds > 0" class="se-status-cell">
          <v-icon size="13">mdi-timer-outline</v-icon>
          {{ formatTime(activeSlide.tempo_seconds) }}
        </span>
        <span v-if="song.audio_name" class="se-status-cell">
          <v-icon size="13" :color="audioPlaying ? 'success' : undefined">
            {{ audioPlaying ? "mdi-music-note-eighth" : "mdi-music-note" }}
          </v-icon>
          <span class="se-audio-time">
            {{ formatTime(audioCurrentTime) }} / {{ formatTime(audioDuration) }}
          </span>
        </span>
        <span class="se-status-cell">
          <v-icon size="13">mdi-aspect-ratio</v-icon>
          {{ aspectRatioLabel }}
        </span>
      </div>
    </template>

    <!-- Workspace -->
    <div class="se-workspace">
      <!-- Coluna esquerda: lista de slides -->
      <aside class="se-slide-list">
        <div class="se-slide-list-header">
          <span class="se-slide-list-title">{{ t("labels.slides") }}</span>
          <span class="se-slide-list-count">{{ slides.length }}</span>
        </div>
        <div class="se-slide-list-body">
          <draggable :list="slides" item-key="id" handle=".se-thumb" @end="onReorder">
            <template #item="{ element, index }">
              <div
                class="se-thumb"
                :class="{ 'is-active': index === current }"
                :style="thumbStyle(element)"
                @click="goSlide(index)"
              >
                <span class="se-thumb-num">{{ index + 1 }}</span>
                <span v-if="element.tempo_seconds > 0" class="se-thumb-time">
                  <v-icon size="9">mdi-clock-outline</v-icon>
                  {{ formatTime(element.tempo_seconds) }}
                </span>
                <div
                  class="se-thumb-text"
                  :style="{ color: element.cor_letra, textAlign: element.text_align || 'center' }"
                >
                  {{ truncate(element.letra) || `(${element.tipo})` }}
                </div>
              </div>
            </template>
          </draggable>
          <button class="se-slide-list-add" @click="actNewSlide">
            <v-icon size="18">mdi-plus-circle-outline</v-icon>
            <span>{{ t("actions.new_slide") }}</span>
          </button>
        </div>
      </aside>

      <!-- Coluna central: preview + player ao pé -->
      <section class="se-center">
        <div class="se-preview-stage">
          <div class="se-preview-frame" :class="`is-${aspectRatio}`">
            <div class="se-preview" :style="previewStyle">
              <div class="se-preview-inner">
                <div
                  v-if="activeSlide.letra"
                  class="se-preview-text se-preview-text--main"
                  :style="mainTextStyle"
                >
                  {{ activeSlide.letra }}
                </div>
                <div
                  v-if="activeSlide.letra_aux"
                  class="se-preview-text se-preview-text--aux"
                  :style="auxTextStyle"
                >
                  {{ activeSlide.letra_aux }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Player persistente embaixo do preview (visível sempre que há áudio) -->
        <div v-if="audioUrl" class="se-player">
          <button
            type="button"
            class="se-player-play"
            :class="{ 'is-playing': audioPlaying }"
            :title="audioPlaying ? 'Pausar' : 'Reproduzir'"
            @click="togglePlay"
          >
            <v-icon size="22">{{ audioPlaying ? "mdi-pause" : "mdi-play" }}</v-icon>
          </button>
          <div class="se-player-time">
            <span class="se-player-time-current">{{ formatTime(audioCurrentTime) }}</span>
            <span class="se-player-time-total">{{ formatTime(audioDuration) }}</span>
          </div>
          <div class="se-timeline" @click="onTimelineClick">
            <div class="se-timeline-fill" :style="{ width: `${timelineProgress}%` }" />
            <div
              v-for="s in slidesWithTime"
              :key="`m-${s.index}`"
              class="se-timeline-marker"
              :class="{ 'is-current': s.index === current }"
              :style="{ left: `${(s.time / audioDuration) * 100}%` }"
              :title="`Slide ${s.index + 1} — ${formatTime(s.time)}`"
              @click.stop="jumpToSlide(s.index)"
            />
            <div class="se-timeline-thumb" :style="{ left: `${timelineProgress}%` }" />
          </div>
          <div class="se-player-slide-badge" :title="song.audio_name">
            <v-icon size="12">mdi-music-note</v-icon>
            {{ current + 1 }}/{{ slides.length }}
          </div>
        </div>

        <!-- Áudio invisível, fonte de eventos para o player customizado -->
        <audio
          v-if="audioUrl"
          ref="audioEl"
          :src="audioUrl"
          hidden
          @play="audioPlaying = true"
          @pause="audioPlaying = false"
          @ended="audioPlaying = false"
          @timeupdate="onAudioTime"
          @loadedmetadata="onAudioLoad"
        />
      </section>

      <!-- Coluna direita: painel de propriedades (accordions) -->
      <aside class="se-editor-side">
        <!-- ===== Texto ===== -->
        <details class="se-panel" open>
          <summary class="se-panel-head">
            <v-icon size="14">mdi-format-paragraph</v-icon>
            <span>{{ t("labels.main_text") }}</span>
            <v-icon class="se-panel-chev" size="14">mdi-chevron-down</v-icon>
          </summary>
          <div class="se-panel-body">
            <textarea
              v-model="activeSlide.letra"
              class="se-textarea"
              rows="4"
              :placeholder="t('labels.main_text')"
              @input="markDirty"
            />
            <label class="se-field-label">{{ t("labels.aux_text") }}</label>
            <textarea
              v-model="activeSlide.letra_aux"
              class="se-textarea se-textarea--aux"
              rows="2"
              :placeholder="t('labels.aux_text')"
              @input="markDirty"
            />
            <div class="se-row-inline">
              <label class="se-field-label">Alinhamento</label>
              <div class="se-seg">
                <button
                  type="button"
                  class="se-seg-btn"
                  :class="{ 'is-active': activeSlide.text_align === 'left' }"
                  title="Esquerda"
                  @click="
                    activeSlide.text_align = 'left';
                    markDirty();
                  "
                >
                  <v-icon size="14">mdi-format-align-left</v-icon>
                </button>
                <button
                  type="button"
                  class="se-seg-btn"
                  :class="{ 'is-active': activeSlide.text_align === 'center' }"
                  title="Centro"
                  @click="
                    activeSlide.text_align = 'center';
                    markDirty();
                  "
                >
                  <v-icon size="14">mdi-format-align-center</v-icon>
                </button>
                <button
                  type="button"
                  class="se-seg-btn"
                  :class="{ 'is-active': activeSlide.text_align === 'right' }"
                  title="Direita"
                  @click="
                    activeSlide.text_align = 'right';
                    markDirty();
                  "
                >
                  <v-icon size="14">mdi-format-align-right</v-icon>
                </button>
              </div>
            </div>
          </div>
        </details>

        <!-- ===== Cor & Tipografia ===== -->
        <details class="se-panel" open>
          <summary class="se-panel-head">
            <v-icon size="14">mdi-palette-outline</v-icon>
            <span>Cor &amp; Tipografia</span>
            <v-icon class="se-panel-chev" size="14">mdi-chevron-down</v-icon>
          </summary>
          <div class="se-panel-body">
            <div class="se-row-inline">
              <label class="se-field-label">{{ t("labels.background") }}</label>
              <input
                v-model="activeSlide.cor_fundo"
                type="color"
                class="se-color-input"
                :title="t('labels.color')"
                @change="markDirty"
              />
            </div>
            <div class="se-row-inline">
              <label class="se-field-label">{{ t("labels.main_text") }}</label>
              <input
                v-model="activeSlide.cor_letra"
                type="color"
                class="se-color-input"
                :title="t('labels.color')"
                @change="markDirty"
              />
              <input
                v-model.number="activeSlide.tamanho_letra"
                type="number"
                min="1"
                max="100"
                class="se-num-input"
                :title="t('labels.size')"
                @change="markDirty"
              />
              <span class="se-suffix">%</span>
            </div>
            <div class="se-row-inline">
              <label class="se-field-label">{{ t("labels.aux_text") }}</label>
              <input
                v-model="activeSlide.cor_letra_aux"
                type="color"
                class="se-color-input"
                :title="t('labels.color')"
                @change="markDirty"
              />
              <input
                v-model.number="activeSlide.tamanho_letra_aux"
                type="number"
                min="1"
                max="100"
                class="se-num-input"
                :title="t('labels.size')"
                @change="markDirty"
              />
              <span class="se-suffix">%</span>
            </div>
            <label class="se-checkbox-row">
              <input
                type="checkbox"
                :checked="transparentBg"
                @change="
                  transparentBg = $event.target.checked;
                  markDirty();
                "
              />
              <span>{{ t("labels.transparent_bg") }}</span>
            </label>
          </div>
        </details>

        <!-- ===== Imagem de Fundo ===== -->
        <details class="se-panel">
          <summary class="se-panel-head">
            <v-icon size="14">mdi-image-outline</v-icon>
            <span>Imagem de Fundo</span>
            <v-icon class="se-panel-chev" size="14">mdi-chevron-down</v-icon>
          </summary>
          <div class="se-panel-body">
            <div v-if="activeImageUrl" class="se-img-preview-row">
              <div class="se-img-thumb" :style="{ backgroundImage: `url(${activeImageUrl})` }" />
              <div class="se-img-actions">
                <button type="button" class="se-act-btn" @click="actSetImage">
                  <v-icon size="14">mdi-image-edit-outline</v-icon>
                  Trocar
                </button>
                <button type="button" class="se-act-btn" @click="actRemoveImage">
                  <v-icon size="14">mdi-image-off-outline</v-icon>
                  Remover
                </button>
              </div>
            </div>
            <button v-else type="button" class="se-img-empty" @click="actSetImage">
              <v-icon size="20">mdi-image-plus</v-icon>
              <span>Adicionar imagem de fundo</span>
            </button>

            <div v-if="activeImageUrl" class="se-row-inline">
              <label class="se-field-label">{{ t("labels.position") }}</label>
              <select
                v-model.number="activeSlide.imagem_posicao"
                class="se-select"
                @change="markDirty"
              >
                <option v-for="p in 9" :key="p" :value="p">{{ t(`positions.${p}`) }}</option>
              </select>
            </div>
          </div>
        </details>

        <!-- ===== Replicar ===== -->
        <details class="se-panel">
          <summary class="se-panel-head">
            <v-icon size="14">mdi-content-duplicate</v-icon>
            <span>Replicar para</span>
            <v-icon class="se-panel-chev" size="14">mdi-chevron-down</v-icon>
          </summary>
          <div class="se-panel-body">
            <div class="se-field">
              <label class="se-field-label">{{ t("labels.replicate_bg") }}</label>
              <div class="se-actions-row">
                <button
                  type="button"
                  class="se-act-btn se-act-btn--small"
                  :title="t('actions.replicate_bg_next')"
                  @click="replicateBg('next')"
                >
                  <v-icon size="14">mdi-arrow-right-bold</v-icon>
                  Seguinte
                </button>
                <button
                  type="button"
                  class="se-act-btn se-act-btn--small"
                  :title="t('actions.replicate_bg_after')"
                  @click="replicateBg('after')"
                >
                  <v-icon size="14">mdi-arrow-expand-right</v-icon>
                  Todos seg.
                </button>
                <button
                  type="button"
                  class="se-act-btn se-act-btn--small"
                  :title="t('actions.replicate_bg_all')"
                  @click="replicateBg('all')"
                >
                  <v-icon size="14">mdi-format-line-spacing</v-icon>
                  Todos
                </button>
              </div>
            </div>
            <div class="se-field">
              <label class="se-field-label">{{ t("labels.replicate_text") }}</label>
              <div class="se-actions-row">
                <button
                  type="button"
                  class="se-act-btn se-act-btn--small"
                  :title="t('actions.replicate_text_next')"
                  @click="replicateText('next')"
                >
                  <v-icon size="14">mdi-arrow-right-bold</v-icon>
                  Seguinte
                </button>
                <button
                  type="button"
                  class="se-act-btn se-act-btn--small"
                  :title="t('actions.replicate_text_after')"
                  @click="replicateText('after')"
                >
                  <v-icon size="14">mdi-arrow-expand-right</v-icon>
                  Todos seg.
                </button>
                <button
                  type="button"
                  class="se-act-btn se-act-btn--small"
                  :title="t('actions.replicate_text_all')"
                  @click="replicateText('all')"
                >
                  <v-icon size="14">mdi-format-line-spacing</v-icon>
                  Todos
                </button>
              </div>
            </div>
          </div>
        </details>
      </aside>
    </div>

    <input ref="fileSlja" type="file" accept=".slja,.lja" hidden @change="onLoadSlja" />
    <input ref="fileTxt" type="file" accept=".txt" hidden @change="onImportTxt" />
    <input ref="fileAudio" type="file" accept="audio/*" hidden @change="onPickAudio" />
    <input ref="fileImage" type="file" accept="image/*" hidden @change="onPickImage" />
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import SljaConverter from "@/helpers/SljaConverter";
import AudioLibrary from "@/helpers/AudioLibrary";
import CustomSongs from "@/helpers/CustomSongs";
import $alert from "@/helpers/Alert";
import { openProjectionWindows } from "@/helpers/ProjectionWindows";
import { useSlideStyle } from "@/composables/useSlideStyle";

const SESSION_KEY = "slide_editor_song_v2";

const moduleContainer = ref(null);
const audioEl = ref(null);
const fileSlja = ref(null);
const fileTxt = ref(null);
const fileAudio = ref(null);
const fileImage = ref(null);

const aspectRatio = ref("16-9");
const song = ref(CustomSongs.newSong());
const slides = computed({
  get: () => song.value.slides,
  set: (v) => {
    song.value.slides = v;
  },
});
const current = ref(0);
const dirty = ref(false);
const audioUrl = ref("");
const audioPlaying = ref(false);
const audioCurrentTime = ref(0);
const audioDuration = ref(0);

const t = (key) => moduleContainer.value?.t(key) || key;

const activeSlide = computed(() => slides.value[current.value] || CustomSongs.newSlide());

const transparentBg = computed({
  get: () => activeSlide.value.fundo_letra === false,
  set: (v) => {
    activeSlide.value.fundo_letra = !v;
  },
});

const songTitle = computed(() => song.value.nome || t("data.untitled"));

function renameSong() {
  const name = prompt(t("labels.name"), song.value.nome || "");
  if (name && name !== song.value.nome) {
    song.value.nome = name;
    markDirty();
  }
}

const aspectRatioLabel = computed(() => {
  if (aspectRatio.value === "full") return t("actions.fullscreen_view");
  if (aspectRatio.value === "4-3") return t("actions.ratio_4_3");
  return t("actions.ratio_16_9");
});

const POSITION_MAP = {
  1: { x: "left", y: "top" },
  2: { x: "center", y: "top" },
  3: { x: "right", y: "top" },
  4: { x: "left", y: "center" },
  5: { x: "center", y: "center" },
  6: { x: "right", y: "center" },
  7: { x: "left", y: "bottom" },
  8: { x: "center", y: "bottom" },
  9: { x: "right", y: "bottom" },
};

const resolvedImages = ref(new Map());

const activeImageUrl = computed(() => {
  const tok = activeSlide.value?.imagem;
  if (!tok) return "";
  if (/^(https?|data|blob|file):/.test(tok)) return tok;
  return resolvedImages.value.get(tok) || "";
});

const previewStyle = computed(() => {
  const s = activeSlide.value;
  const style = { background: s.cor_fundo };
  const url = resolvedImages.value.get(s.imagem);
  if (url) {
    const pos = POSITION_MAP[s.imagem_posicao] || POSITION_MAP[5];
    style.backgroundImage = `url(${url})`;
    style.backgroundPosition = `${pos.x} ${pos.y}`;
    style.backgroundSize = "cover";
    style.backgroundRepeat = "no-repeat";
  }
  return style;
});

function thumbStyle(slide) {
  const url = resolvedImages.value.get(slide.imagem);
  const style = { background: slide.cor_fundo };
  if (url) {
    style.backgroundImage = `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.5)), url(${url})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  return style;
}

async function ensureImageResolved(token) {
  if (!token || resolvedImages.value.has(token)) return;
  if (/^(https?|data|blob|file):/.test(token)) {
    resolvedImages.value.set(token, token);
    return;
  }
  const url = await AudioLibrary.resolveImage(token);
  if (url) resolvedImages.value.set(token, url);
}

// Composable de estilo compartilhado — garante mesma fonte/peso/sombra que a
// projeção real e o restante do app. Sobrescrevemos só o fontSize (queremos
// cqh em vez de vh, pois o preview é menor) e o alinhamento por slide.
const slideStyle = useSlideStyle();

const previewSlideForStyle = computed(() => {
  const s = activeSlide.value;
  return {
    lyric: s.letra,
    aux_lyric: s.letra_aux,
    color: s.cor_letra,
    color_aux: s.cor_letra_aux,
    font_size_pct: s.tamanho_letra,
    font_size_aux_pct: s.tamanho_letra_aux,
    cover: s.tipo === "CAPA",
  };
});

// Tamanho do preview replica EXATAMENTE o que Slide.vue (projeção real) usa:
// clamp com a config global cfg.font_size_*, ignorando tamanho_letra do slide.
// O Slide.vue dá `delete out.fontSize` e aplica CSS class com cfg global —
// fazemos o mesmo cálculo inline aqui.
const mainTextStyle = computed(() => {
  const s = activeSlide.value;
  const isCover = s.tipo === "CAPA";
  const base = isCover
    ? slideStyle.coverStyle(previewSlideForStyle.value)
    : slideStyle.lyricStyle(previewSlideForStyle.value);
  const sizeVar = isCover
    ? slideStyle.cfg.value.font_size_cover
    : slideStyle.cfg.value.font_size_lyric;
  const min = isCover ? 20 : 18;
  const max = isCover ? 220 : 200;
  return {
    ...base,
    fontSize: `clamp(${min}px, calc(${sizeVar} * 1cqh), ${max}px)`,
    textAlign: s.text_align || "center",
    background: s.fundo_letra ? "rgba(0,0,0,0.55)" : "transparent",
    padding: "0.4cqh 1cqh",
    borderRadius: "0.4cqh",
  };
});

const auxTextStyle = computed(() => {
  const s = activeSlide.value;
  const base = slideStyle.auxStyle(previewSlideForStyle.value);
  const sizeVar = slideStyle.cfg.value.font_size_aux;
  return {
    ...base,
    fontSize: `clamp(14px, calc(${sizeVar} * 1cqh), 120px)`,
    textAlign: s.text_align || "center",
    background: s.fundo_letra ? "rgba(0,0,0,0.55)" : "transparent",
    padding: "0.4cqh 1cqh",
    borderRadius: "0.4cqh",
  };
});

function markDirty() {
  dirty.value = true;
}

function truncate(text) {
  if (!text) return "";
  return text.length > 60 ? text.slice(0, 57) + "…" : text;
}

function formatTime(s) {
  return SljaConverter.secondsToHms(s || 0);
}

function goSlide(idx) {
  if (!slides.value.length) return;
  const clamped = Math.max(0, Math.min(slides.value.length - 1, idx));
  current.value = clamped;
  // Sincronia com o áudio: se o slide tem tempo gravado, dá seek para que o
  // player reflita a posição daquele slide. Funciona tanto pausado (preview)
  // quanto tocando (operador pulando para um ponto da música).
  const ts = slides.value[clamped]?.tempo_seconds || 0;
  if (audioEl.value && ts > 0) {
    audioEl.value.currentTime = ts;
    audioCurrentTime.value = ts;
  }
}

function onReorder() {
  markDirty();
}

let _sessionTimer = null;
watch(
  song,
  (val) => {
    if (_sessionTimer) clearTimeout(_sessionTimer);
    _sessionTimer = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(val));
      } catch {
        /* noop — quota cheia ou conteúdo grande demais */
      }
    }, 300);
  },
  { deep: true }
);

watch(
  () => slides.value.map((s) => s.imagem).filter(Boolean),
  (tokens) => {
    for (const tok of tokens) ensureImageResolved(tok);
  },
  { immediate: true, deep: true }
);

async function rebuildAudioUrl() {
  if (!song.value.audio_token) {
    audioUrl.value = "";
    audioCurrentTime.value = 0;
    audioDuration.value = 0;
    return;
  }
  const url = await AudioLibrary.resolveAudio(song.value.audio_token);
  audioUrl.value = url || "";
}

watch(() => song.value.audio_token, rebuildAudioUrl, { immediate: true });

// Invariante: sempre ter pelo menos 1 slide para evitar escritas perdidas em
// activeSlide (que faria fallback a um objeto descartável).
watch(
  () => slides.value.length,
  (n) => {
    if (n === 0) {
      song.value.slides = [CustomSongs.newSlide({ tipo: "LETRA" })];
      current.value = 0;
    } else if (current.value > n - 1) {
      current.value = n - 1;
    }
  },
  { immediate: true }
);

function onAudioTime() {
  if (!audioEl.value) return;
  audioCurrentTime.value = audioEl.value.currentTime;
  // Paridade Delphi: durante reprodução, troca de slide automaticamente quando
  // o tempo do áudio cruza o tempo_seconds de outro slide.
  if (audioPlaying.value) syncSlideFromAudio();
}

function syncSlideFromAudio() {
  const t = audioCurrentTime.value;
  // Encontra o último slide cujo tempo_seconds <= t.
  let target = -1;
  for (let i = 0; i < slides.value.length; i++) {
    const ts = slides.value[i].tempo_seconds;
    if (ts > 0 && ts <= t) target = i;
    else if (ts > t) break;
  }
  if (target >= 0 && target !== current.value) {
    current.value = target;
  }
}
function onAudioLoad() {
  if (!audioEl.value) return;
  audioDuration.value = audioEl.value.duration || 0;
}
function onSeek(seconds) {
  if (!audioEl.value) return;
  const v = Number(seconds);
  if (Number.isFinite(v)) {
    audioEl.value.currentTime = v;
    audioCurrentTime.value = v;
  }
}

const timelineProgress = computed(() => {
  if (!audioDuration.value) return 0;
  return Math.min(100, (audioCurrentTime.value / audioDuration.value) * 100);
});

const slidesWithTime = computed(() =>
  slides.value.map((s, index) => ({ index, time: s.tempo_seconds })).filter((s) => s.time > 0)
);

function onTimelineClick(ev) {
  if (!audioEl.value || !audioDuration.value) return;
  const rect = ev.currentTarget.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
  onSeek(ratio * audioDuration.value);
}

function jumpToSlide(idx) {
  goSlide(idx);
}

function loadSongFromShare() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (data && Array.isArray(data.slides)) {
      song.value = data;
      current.value = 0;
      dirty.value = false;
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* noop */
  }
}

function onOpenSong(ev) {
  const data = ev?.detail;
  if (data && Array.isArray(data.slides)) {
    song.value = data;
    current.value = 0;
    dirty.value = false;
  }
}

function actAudioRemove() {
  song.value.audio_token = "";
  song.value.audio_name = "";
  audioUrl.value = "";
  audioPlaying.value = false;
  markDirty();
}

const RIBBON_HANDLERS = {
  new: actNew,
  open: actOpen,
  save: actSave,
  save_as: actSaveAs,
  import_txt: actImportTxt,
  project: actProject,
  new_slide: actNewSlide,
  duplicate_slide: actDuplicateSlide,
  remove_slide: actRemoveSlide,
  split_slide: actSplitSlide,
  merge_next: actMergeNext,
  first: () => goSlide(0),
  prev: () => goSlide(current.value - 1),
  next: () => goSlide(current.value + 1),
  last: () => goSlide(slides.value.length - 1),
  audio_attach: actAttachAudio,
  audio_remove: actAudioRemove,
  play_pause: togglePlay,
  record_advance: recordAdvance,
  record_start: recordStart,
  record_retroactive: recordRetroactive,
  record_clear: recordClear,
  view_full: () => (aspectRatio.value = "full"),
  view_4_3: () => (aspectRatio.value = "4-3"),
  view_16_9: () => (aspectRatio.value = "16-9"),
};

useBroadcastListener(BROADCAST_TYPE.MODULE_RIBBON_ACTION, (payload) => {
  if (payload?.module !== "slide_editor") return;
  const handler = RIBBON_HANDLERS[payload.action];
  if (handler) handler();
});

onMounted(() => {
  loadSongFromShare();
  window.addEventListener("lj:open-song", onOpenSong);
});

onBeforeUnmount(() => {
  window.removeEventListener("lj:open-song", onOpenSong);
  AudioLibrary.clearSession();
});

function confirmDiscard() {
  if (!dirty.value) return true;
  return new Promise((resolve) => {
    $alert.yesno({ title: t("data.discard_changes"), translate: false }, (resp) =>
      resolve(resp === "yes")
    );
  });
}

function onClose() {
  isProjecting.value = false;
  AudioLibrary.clearSession();
}

// ===== Ações =====

async function actNew() {
  if (dirty.value) {
    const ok = await confirmDiscard();
    if (!ok) return;
  }
  song.value = CustomSongs.newSong(t("data.untitled"));
  current.value = 0;
  dirty.value = false;
  AudioLibrary.clearSession();
}

function actOpen() {
  fileSlja.value.click();
}

async function onLoadSlja(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = await SljaConverter.loadSlja(file);

    let audioToken = "";
    let audioName = "";
    if (data.audio) {
      const name = (data.audioName || "audio.mp3").replace(/^audio\//, "");
      audioToken = AudioLibrary.setSessionAudio(name, data.audio);
      audioName = name;
    }

    const imgTokenByName = new Map();
    for (const [path, blob] of (data.images || new Map()).entries()) {
      const name = path.replace(/^(imagens|images)\//, "");
      const tok = AudioLibrary.setSessionImage(name, blob);
      imgTokenByName.set(name, tok);
      imgTokenByName.set(path, tok);
    }

    const newSong = {
      id: CustomSongs.newId("song"),
      nome: file.name.replace(/\.(slja|lja)$/i, "") || t("data.untitled"),
      audio_token: audioToken,
      audio_name: audioName,
      slides: data.slides.map((s) => {
        const imgName = s.imagem ? s.imagem.split(/[\\/]/).pop() : "";
        const imgTok = imgName
          ? imgTokenByName.get(s.imagem) || imgTokenByName.get(imgName) || ""
          : "";
        return {
          id: CustomSongs.newId("slide"),
          tipo: s.tipo,
          letra: s.letra,
          letra_aux: s.letra_aux,
          tamanho_letra: s.tamanho_letra,
          tamanho_letra_aux: s.tamanho_letra_aux,
          cor_letra: s.cor_letra,
          cor_letra_aux: s.cor_letra_aux,
          cor_fundo: s.cor_fundo,
          imagem: imgTok,
          imagem_posicao: s.imagem_posicao,
          fundo_letra: s.fundo_letra,
          tempo_seconds: s.tempo_seconds,
          text_align: s.text_align || "center",
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    song.value = newSong;
    current.value = 0;
    dirty.value = false;
  } catch (err) {
    alert(t("data.invalid_file") + "\n\n" + (err?.message || err));
  }
}

async function buildExportSlja() {
  const slidesForExport = [];
  const imagesMap = new Map();

  for (const s of song.value.slides) {
    const exportSlide = { ...s };
    if (s.imagem) {
      const blob = await AudioLibrary.getImageBlob(s.imagem);
      if (blob) {
        const baseName = `${s.imagem.replace(/^.*\//, "").replace(/\.[^.]+$/, "")}.${(blob.type.split("/")[1] || "png").replace("jpeg", "jpg")}`;
        const path = `imagens/${baseName}`;
        if (!imagesMap.has(path)) imagesMap.set(path, blob);
        exportSlide.imagem = path;
      } else {
        exportSlide.imagem = "";
      }
    }
    slidesForExport.push(exportSlide);
  }

  let audioBlob = null;
  let audioName = song.value.audio_name || "audio.mp3";
  if (song.value.audio_token) {
    audioBlob = await AudioLibrary.getAudioBlob(song.value.audio_token);
  }

  return SljaConverter.writeSlja({
    slides: slidesForExport,
    audio: audioBlob,
    audioName,
    images: imagesMap,
  });
}

async function materializeMedia(s) {
  const out = { ...s };
  // Áudio: pkg:// é volátil (sessionAudio), só persiste se importado como lib://
  if (out.audio_token && out.audio_token.startsWith("pkg://audio/")) {
    const blob = await AudioLibrary.getAudioBlob(out.audio_token);
    if (blob) {
      out.audio_token = await AudioLibrary.importAudio(
        blob,
        out.audio_name || out.audio_token.split("/").pop() || "audio.mp3"
      );
    }
  }
  // Imagens por slide: mesma lógica
  const newSlides = [];
  for (const slide of out.slides || []) {
    if (slide.imagem && slide.imagem.startsWith("pkg://")) {
      const blob = await AudioLibrary.getImageBlob(slide.imagem);
      if (blob) {
        const name = slide.imagem.split("/").pop() || "image.png";
        const newToken = await AudioLibrary.importImage(blob, name);
        newSlides.push({ ...slide, imagem: newToken });
        continue;
      }
    }
    newSlides.push(slide);
  }
  out.slides = newSlides;
  return out;
}

async function actSave() {
  try {
    const materialized = await materializeMedia(song.value);
    const saved = await CustomSongs.saveSong(materialized);
    song.value = saved;
    dirty.value = false;
    $alert.info({
      title: t("actions.save"),
      text: songTitle.value,
      translate: false,
    });
  } catch (err) {
    $alert.error({
      title: t("data.invalid_file"),
      text: String(err?.message || err),
      translate: false,
    });
  }
}

async function actSaveAs() {
  const name = prompt(t("actions.save_as"), song.value.nome || t("data.untitled"));
  if (!name) return;
  try {
    song.value.nome = name;
    const materialized = await materializeMedia(song.value);
    const saved = await CustomSongs.saveSong(materialized);
    song.value = saved;
    await downloadSlja(name);
    dirty.value = false;
  } catch (err) {
    $alert.error({
      title: t("data.invalid_file"),
      text: String(err?.message || err),
      translate: false,
    });
  }
}

async function downloadSlja(name) {
  try {
    const blob = await buildExportSlja();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[\\/:*?"<>|]/g, "_")}.slja`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(t("data.invalid_file") + "\n\n" + (err?.message || err));
  }
}

function actImportTxt() {
  fileTxt.value.click();
}

async function readTxtWithEncoding(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

async function onImportTxt(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const text = await readTxtWithEncoding(file);

  const idx = current.value;
  const newSlide = CustomSongs.newSlide({
    ...slides.value[idx],
    letra: text,
    id: CustomSongs.newId("slide"),
    tempo_seconds: 0,
  });
  slides.value.splice(idx + 1, 0, newSlide);
  current.value = idx + 1;
  splitSlideAt(current.value);
  markDirty();
}

async function toProjectionPayload(s) {
  if (!s) return null;
  let urlImage = null;
  if (s.imagem) {
    urlImage =
      resolvedImages.value.get(s.imagem) || (await AudioLibrary.resolveImage(s.imagem)) || null;
  }
  return {
    lyric: s.letra || "",
    aux_lyric: s.letra_aux || "",
    url_image: urlImage,
    image_position: typeof s.imagem_posicao === "number" ? s.imagem_posicao - 1 : 4,
    cover: s.tipo === "CAPA",
    tipo: s.tipo,
    color: s.cor_letra,
    color_aux: s.cor_letra_aux,
    font_size_pct: s.tamanho_letra,
    font_size_aux_pct: s.tamanho_letra_aux,
    name: song.value.nome,
  };
}

async function broadcastCurrentSlide() {
  const slidePayload = await toProjectionPayload(activeSlide.value);
  const nextPayload = await toProjectionPayload(slides.value[current.value + 1]);
  $broadcast.send(BROADCAST_TYPE.SLIDE_CHANGE, {
    slide_index: current.value,
    slide: slidePayload,
    next_slide: nextPayload,
    title: song.value.nome,
    progress: 0,
    total_slides: slides.value.length,
  });
}

// Flag de "estamos projetando" para esta sessão do editor. Enquanto verdadeiro,
// trocas de slide refletem imediatamente nas janelas de projeção abertas.
const isProjecting = ref(false);

async function actProject() {
  try {
    await openProjectionWindows();
  } catch (err) {
    console.warn("[slide_editor] openProjectionWindows falhou:", err);
  }
  isProjecting.value = true;
  await broadcastCurrentSlide();
}

// Re-emite quando a janela /projection (ou /projection/return) monta e pede
// estado. Sem isso, ela mostra tela em branco até a próxima troca de slide.
useBroadcastListener(BROADCAST_TYPE.REQUEST_SLIDE_STATE, () => {
  if (!isProjecting.value) return;
  broadcastCurrentSlide();
});

// Reflete trocas e edições do slide ativo na janela de projeção ao vivo,
// com debounce para evitar flood durante digitação.
let _projTimer = null;
function scheduleProjectionBroadcast() {
  if (!isProjecting.value) return;
  if (_projTimer) clearTimeout(_projTimer);
  _projTimer = setTimeout(() => broadcastCurrentSlide(), 120);
}
watch(current, scheduleProjectionBroadcast);
watch(() => activeSlide.value, scheduleProjectionBroadcast, { deep: true });

function actNewSlide() {
  const cur = slides.value[current.value];
  const tipo = slides.value.length === 0 ? "CAPA" : "LETRA";
  const ns = CustomSongs.newSlide({
    tipo,
    cor_fundo: cur?.cor_fundo,
    cor_letra: cur?.cor_letra,
    cor_letra_aux: cur?.cor_letra_aux,
    tamanho_letra: cur?.tamanho_letra,
    tamanho_letra_aux: cur?.tamanho_letra_aux,
    fundo_letra: cur?.fundo_letra ?? true,
    imagem: cur?.imagem,
    imagem_posicao: cur?.imagem_posicao,
  });
  slides.value.splice(current.value + 1, 0, ns);
  current.value = Math.min(current.value + 1, slides.value.length - 1);
  markDirty();
}

function actDuplicateSlide() {
  const s = slides.value[current.value];
  if (!s) return;
  slides.value.splice(current.value + 1, 0, { ...s, id: CustomSongs.newId("slide") });
  current.value += 1;
  markDirty();
}

function actRemoveSlide() {
  if (slides.value.length <= 1) {
    // Mantém invariante de pelo menos 1 slide: reseta o único restante.
    slides.value.splice(0, 1, CustomSongs.newSlide({ tipo: "LETRA" }));
    current.value = 0;
  } else {
    slides.value.splice(current.value, 1);
    current.value = Math.max(0, current.value - 1);
  }
  markDirty();
}

function splitSlideAt(idx) {
  const s = slides.value[idx];
  if (!s) return;
  const parts = (s.letra || "").split(/\r?\n/);
  if (parts.length <= 1) return;
  const fragments = parts.map((line, i) => {
    const letra = line.replace(/\|/g, "\n");
    if (i === 0) return { ...s, letra };
    return {
      ...s,
      id: CustomSongs.newId("slide"),
      letra,
      tempo_seconds: 0,
    };
  });
  slides.value.splice(idx, 1, ...fragments);
}

function actSplitSlide() {
  splitSlideAt(current.value);
  markDirty();
}

function actMergeNext() {
  const i = current.value;
  if (i >= slides.value.length - 1) return;
  const cur = slides.value[i];
  const next = slides.value[i + 1];
  cur.letra = `${cur.letra || ""}\n${next.letra || ""}`.trim();
  slides.value.splice(i + 1, 1);
  markDirty();
}

function actAttachAudio() {
  fileAudio.value.click();
}

async function onPickAudio(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const token = await AudioLibrary.importAudio(file, file.name);
  song.value.audio_token = token;
  song.value.audio_name = file.name;
  markDirty();
}

function requireAudio() {
  if (!audioEl.value) {
    $alert.info({
      title: t("data.no_audio"),
      text: t("actions.audio_attach"),
      translate: false,
    });
    return false;
  }
  return true;
}

function togglePlay() {
  if (!requireAudio()) return;
  if (!audioEl.value.paused) {
    audioEl.value.pause();
    return;
  }
  // Validação paridade Delphi (fmEditorSlides.pas:849): se o slide atual não
  // tem tempo gravado e não é o primeiro, orienta a começar do início.
  const slide = activeSlide.value;
  if (slide && slide.tempo_seconds === 0 && current.value > 0) {
    $alert.info({
      title: t("data.no_audio"),
      text: "Não há tempo gravado neste slide. Reproduza a partir do primeiro slide para começar a gravar os tempos.",
      translate: false,
    });
    return;
  }
  // Seek para o tempo do slide atual antes de iniciar (paridade Delphi:1136).
  if (slide && slide.tempo_seconds > 0) {
    audioEl.value.currentTime = slide.tempo_seconds;
  }
  audioEl.value.play();
}

function recordAdvance() {
  if (!requireAudio() || !slides.value.length) return;
  activeSlide.value.tempo_seconds = Math.round(audioEl.value.currentTime);
  if (current.value < slides.value.length - 1) current.value += 1;
  markDirty();
}

function recordStart() {
  if (!requireAudio() || !slides.value.length) return;
  activeSlide.value.tempo_seconds = Math.round(audioEl.value.currentTime);
  markDirty();
}

// "Retroativo": grava no slide ATUAL um instante levemente anterior ao tempo
// do áudio agora — premissa: o operador percebeu o início tarde demais.
const RETROACTIVE_OFFSET_S = 2;
function recordRetroactive() {
  if (!requireAudio() || !slides.value.length) return;
  const t = Math.max(0, Math.round(audioEl.value.currentTime - RETROACTIVE_OFFSET_S));
  activeSlide.value.tempo_seconds = t;
  markDirty();
}

function recordClear() {
  for (const s of slides.value) s.tempo_seconds = 0;
  markDirty();
}

function actSetImage() {
  if (!fileImage.value) return;
  fileImage.value.click();
}

async function onPickImage(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const token = await AudioLibrary.importImage(file, file.name);
    activeSlide.value.imagem = token;
    await ensureImageResolved(token);
    markDirty();
  } catch (err) {
    $alert.error({
      title: "Erro ao adicionar imagem",
      text: String(err?.message || err),
      translate: false,
    });
  }
}

function actRemoveImage() {
  if (!slides.value.length) return;
  activeSlide.value.imagem = "";
  markDirty();
}

function copyVisualFields(src, dst, mode) {
  if (mode === "bg") {
    dst.cor_fundo = src.cor_fundo;
    dst.imagem = src.imagem;
    dst.imagem_posicao = src.imagem_posicao;
  } else if (mode === "text") {
    dst.tamanho_letra = src.tamanho_letra;
    dst.tamanho_letra_aux = src.tamanho_letra_aux;
    dst.cor_letra = src.cor_letra;
    dst.cor_letra_aux = src.cor_letra_aux;
    dst.fundo_letra = src.fundo_letra;
    dst.text_align = src.text_align;
  }
}

function applyReplicate(scope, mode) {
  const src = activeSlide.value;
  if (scope === "next") {
    const tgt = slides.value[current.value + 1];
    if (tgt) copyVisualFields(src, tgt, mode);
  } else if (scope === "after") {
    for (let i = current.value + 1; i < slides.value.length; i++) {
      copyVisualFields(src, slides.value[i], mode);
    }
  } else if (scope === "all") {
    for (let i = 0; i < slides.value.length; i++) {
      if (i !== current.value) copyVisualFields(src, slides.value[i], mode);
    }
  }
  markDirty();
}

function replicateBg(scope) {
  applyReplicate(scope, "bg");
}

function replicateText(scope) {
  applyReplicate(scope, "text");
}
</script>

<style scoped>
/* ============ Header inline (status compacto + rename) ============ */
.se-statusbar-inline {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  font-size: 11px;
  font-family: monospace;
  flex-shrink: 0;
}
.se-rename-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: inherit;
  opacity: 0.55;
  transition:
    background 0.12s,
    opacity 0.12s;
}
.se-rename-btn:hover {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.1);
  opacity: 1;
}
.se-dirty-dot {
  color: rgb(var(--v-theme-warning, 251, 191, 36));
  font-size: 14px;
  flex-shrink: 0;
}
.se-status-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.78;
}
.se-status-cell strong {
  color: rgb(var(--v-theme-primary, 79, 70, 229));
}
.se-audio-time {
  margin-left: 4px;
  opacity: 0.7;
}

/* ============ Workspace ============ */
.se-workspace {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 280px;
  height: 100%;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: var(--lj-surface-bg, #fafafa);
}

/* Slide list */
.se-slide-list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.08);
  background: rgba(var(--v-border-color, 0, 0, 0), 0.02);
  min-height: 0;
}
.se-slide-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.5;
  font-weight: 600;
  border-bottom: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.06);
  flex-shrink: 0;
}
.se-slide-list-count {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.12);
  color: rgb(var(--v-theme-primary, 79, 70, 229));
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
}
.se-slide-list-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.se-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  transition:
    border-color 0.15s,
    transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}
.se-thumb:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.se-thumb.is-active {
  border-color: rgb(var(--v-theme-primary, 79, 70, 229));
  box-shadow: 0 0 0 1px rgba(var(--v-theme-primary, 79, 70, 229), 0.4);
}
.se-thumb-num {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  font-weight: 700;
  color: white;
  background: rgba(0, 0, 0, 0.55);
  padding: 1px 5px;
  border-radius: 8px;
  font-family: monospace;
}
.se-thumb-time {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 9px;
  color: rgb(var(--v-theme-success, 76, 175, 80));
  background: rgba(0, 0, 0, 0.55);
  padding: 1px 5px;
  border-radius: 8px;
  font-family: monospace;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.se-thumb-text {
  font-size: 9px;
  text-align: center;
  overflow: hidden;
  max-height: 100%;
  white-space: pre-line;
  line-height: 1.1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}
.se-slide-list-add {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px dashed rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 6px;
  color: rgb(var(--v-theme-primary, 79, 70, 229));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  margin-top: 4px;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.se-slide-list-add:hover {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.06);
  border-color: rgba(var(--v-theme-primary, 79, 70, 229), 0.5);
}

/* Preview stage */
.se-preview-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1f 0%, #2c2c34 100%);
  padding: 24px;
  min-width: 0;
  overflow: hidden;
}
.se-preview-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}
.se-preview-frame.is-full {
  width: 100%;
  height: 100%;
}
.se-preview-frame.is-16-9 {
  aspect-ratio: 16 / 9;
  width: min(100%, calc(100% * 16 / 9));
  max-height: 100%;
}
.se-preview-frame.is-4-3 {
  aspect-ratio: 4 / 3;
  width: min(100%, calc(100% * 4 / 3));
  max-height: 100%;
}
.se-preview {
  width: 100%;
  height: 100%;
  position: relative;
  container-type: size;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.3);
}
.se-preview-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5cqh;
  padding: 4cqh;
}
.se-preview-text {
  /* font-family/font-weight/textShadow/letterSpacing/color/textAlign vêm
     inline via useSlideStyle (paridade com a projeção real). */
  width: 100%;
  white-space: pre-line;
}
.se-preview-text--aux {
  opacity: 0.92;
}

/* ============ Painel direito ============ */
.se-editor-side {
  display: flex;
  flex-direction: column;
  padding: 6px 8px 12px;
  border-left: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.08);
  background: var(--lj-surface-bg, #fff);
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  min-width: 0;
  gap: 2px;
  box-sizing: border-box;
}
.se-editor-side * {
  box-sizing: border-box;
  min-width: 0;
}

/* Accordion-style panel (uses <details>) */
.se-panel {
  border-top: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.06);
}
.se-panel:first-child {
  border-top: none;
}
.se-panel-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface, 0, 0, 0), 0.7);
  cursor: pointer;
  user-select: none;
  list-style: none;
}
.se-panel-head::-webkit-details-marker {
  display: none;
}
.se-panel-head > span {
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.se-panel-chev {
  transition: transform 0.15s;
  opacity: 0.55;
}
.se-panel[open] .se-panel-chev {
  transform: rotate(180deg);
}
.se-panel-head:hover {
  color: rgb(var(--v-theme-primary, 79, 70, 229));
}
.se-panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 4px 10px;
}
.se-panel-audio-name {
  font-family: monospace;
  font-size: 10px;
  letter-spacing: 0;
  text-transform: none;
  opacity: 0.85;
}

/* Textarea */
.se-textarea {
  width: 100%;
  resize: vertical;
  padding: 6px 8px;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.18);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.45;
  outline: none;
  transition: border-color 0.12s;
}
.se-textarea:focus {
  border-color: rgb(var(--v-theme-primary, 79, 70, 229));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary, 79, 70, 229), 0.1);
}
.se-textarea--aux {
  font-style: italic;
  opacity: 0.88;
}

/* Form fields */
.se-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.se-field-label {
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface, 0, 0, 0), 0.55);
  font-weight: 500;
  flex-shrink: 0;
}

/* Linha horizontal: label à esquerda + controles à direita */
.se-row-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.se-row-inline > .se-field-label {
  min-width: 88px;
  max-width: 88px;
}

.se-color-input {
  width: 32px;
  height: 22px;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 3px;
  background: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.se-num-input {
  width: 46px;
  height: 22px;
  padding: 0 4px;
  font-size: 11px;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 3px;
  background: transparent;
  color: inherit;
  outline: none;
  text-align: right;
  flex-shrink: 0;
}
.se-num-input::-webkit-inner-spin-button,
.se-num-input::-webkit-outer-spin-button {
  opacity: 0.5;
  height: 18px;
}
.se-num-input:focus {
  border-color: rgb(var(--v-theme-primary, 79, 70, 229));
}
.se-suffix {
  font-size: 10px;
  opacity: 0.5;
}
.se-checkbox-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  cursor: pointer;
  min-height: 22px;
  padding-left: 2px;
}
.se-checkbox-row > input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

/* Segmented control (alinhamento) */
.se-seg {
  display: inline-flex;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 3px;
  overflow: hidden;
}
.se-seg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 22px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.55;
  transition:
    background 0.12s,
    opacity 0.12s,
    color 0.12s;
}
.se-seg-btn + .se-seg-btn {
  border-left: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
}
.se-seg-btn:hover {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.06);
  opacity: 1;
}
.se-seg-btn.is-active {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.18);
  color: rgb(var(--v-theme-primary, 79, 70, 229));
  opacity: 1;
}

/* Botões de ação (Imagem, Replicar) */
.se-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.se-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.18);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}
.se-act-btn:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.06);
  border-color: rgba(var(--v-theme-primary, 79, 70, 229), 0.4);
  color: rgb(var(--v-theme-primary, 79, 70, 229));
}
.se-act-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.se-act-btn--small {
  padding: 3px 6px;
  font-size: 10px;
  flex: 1 0 auto;
  justify-content: center;
}

/* Imagem de Fundo */
.se-img-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 80px;
  padding: 14px;
  border: 1px dashed rgba(var(--v-border-color, 0, 0, 0), 0.3);
  border-radius: 6px;
  background: rgba(var(--v-border-color, 0, 0, 0), 0.02);
  color: rgba(var(--v-theme-on-surface, 0, 0, 0), 0.55);
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;
  transition:
    background 0.12s,
    border-color 0.12s,
    color 0.12s;
}
.se-img-empty:hover {
  background: rgba(var(--v-theme-primary, 79, 70, 229), 0.06);
  border-color: rgba(var(--v-theme-primary, 79, 70, 229), 0.5);
  color: rgb(var(--v-theme-primary, 79, 70, 229));
}
.se-img-preview-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.se-img-thumb {
  width: 80px;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  background-color: rgba(var(--v-border-color, 0, 0, 0), 0.06);
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.15);
  flex-shrink: 0;
}
.se-img-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.se-img-actions .se-act-btn {
  justify-content: flex-start;
  width: 100%;
}

/* Select nativo */
.se-select {
  flex: 1;
  height: 22px;
  padding: 0 6px;
  font-size: 11px;
  font-family: inherit;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 3px;
  background: transparent;
  color: inherit;
  outline: none;
  cursor: pointer;
}
.se-select:focus {
  border-color: rgb(var(--v-theme-primary, 79, 70, 229));
}

/* ============ Coluna central (preview + player) ============ */
.se-center {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.se-center .se-preview-stage {
  flex: 1;
}

/* Player persistente abaixo do preview */
.se-player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff;
  flex-shrink: 0;
}
.se-player-play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.12s,
    transform 0.08s;
}
.se-player-play:hover {
  background: rgba(255, 255, 255, 0.22);
}
.se-player-play:active {
  transform: scale(0.95);
}
.se-player-play.is-playing {
  background: rgb(var(--v-theme-success, 76, 175, 80));
  color: #fff;
}
.se-player-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: monospace;
  font-size: 11px;
  line-height: 1.15;
  min-width: 56px;
  flex-shrink: 0;
}
.se-player-time-current {
  color: #fff;
  font-weight: 600;
}
.se-player-time-total {
  opacity: 0.55;
  font-size: 9px;
}

/* Timeline com markers de slides gravados */
.se-timeline {
  flex: 1;
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  min-width: 0;
}
.se-timeline-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(var(--v-theme-success, 76, 175, 80), 0.55);
  border-radius: 4px;
  transition: width 0.08s linear;
  pointer-events: none;
}
.se-timeline-marker {
  position: absolute;
  top: -1px;
  width: 2px;
  height: 10px;
  background: rgba(255, 255, 255, 0.45);
  transform: translateX(-50%);
  transition:
    background 0.12s,
    transform 0.12s;
}
.se-timeline-marker:hover {
  background: #fff;
  transform: translateX(-50%) scaleY(1.4);
}
.se-timeline-marker.is-current {
  background: rgb(var(--v-theme-primary, 79, 70, 229));
  width: 3px;
  height: 14px;
  top: -3px;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary, 79, 70, 229), 0.25);
}
.se-timeline-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.se-player-slide-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 10px;
  font-family: monospace;
  white-space: nowrap;
  opacity: 0.85;
  flex-shrink: 0;
}
</style>
