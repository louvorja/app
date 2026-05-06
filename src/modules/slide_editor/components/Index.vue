<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest" :title="songTitle" @close="onClose">
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

      <!-- Coluna central: preview -->
      <section class="se-preview-stage">
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
      </section>

      <!-- Coluna direita: editor + controles de formatação -->
      <aside class="se-editor-side">
        <!-- Texto -->
        <div class="se-section">
          <div class="se-section-title">
            <v-icon size="14">mdi-format-paragraph</v-icon>
            {{ t("labels.main_text") }}
          </div>
          <textarea
            v-model="activeSlide.letra"
            class="se-textarea"
            rows="5"
            :placeholder="t('labels.main_text')"
            @input="markDirty"
          />

          <div class="se-section-title mt-3">
            <v-icon size="14">mdi-format-text</v-icon>
            {{ t("labels.aux_text") }}
          </div>
          <textarea
            v-model="activeSlide.letra_aux"
            class="se-textarea se-textarea--aux"
            rows="2"
            :placeholder="t('labels.aux_text')"
            @input="markDirty"
          />

          <div class="se-row mt-2">
            <span class="se-row-label">Alinhamento</span>
            <v-btn-toggle
              v-model="activeSlide.text_align"
              mandatory
              density="compact"
              variant="outlined"
              @update:model-value="markDirty"
            >
              <v-btn value="left" icon="mdi-format-align-left" size="x-small" />
              <v-btn value="center" icon="mdi-format-align-center" size="x-small" />
              <v-btn value="right" icon="mdi-format-align-right" size="x-small" />
            </v-btn-toggle>
          </div>
        </div>

        <!-- Formatação -->
        <details class="se-section" open>
          <summary class="se-section-title se-section-summary">
            <v-icon size="14">mdi-palette-outline</v-icon>
            {{ t("tabs.format") }}
          </summary>

          <div class="se-row">
            <span class="se-row-label">{{ t("labels.background") }}</span>
            <input
              v-model="activeSlide.cor_fundo"
              type="color"
              :title="t('labels.color')"
              class="se-color-input"
              @change="markDirty"
            />
          </div>

          <div class="se-row">
            <span class="se-row-label">{{ t("labels.position") }}</span>
            <v-select
              v-model="activeSlide.imagem_posicao"
              :items="positionItems"
              density="compact"
              hide-details
              variant="outlined"
              @update:model-value="markDirty"
            />
          </div>

          <div class="se-row">
            <span class="se-row-label">{{ t("labels.main_text") }}</span>
            <input
              v-model="activeSlide.cor_letra"
              type="color"
              :title="t('labels.color')"
              class="se-color-input"
              @change="markDirty"
            />
            <v-text-field
              v-model.number="activeSlide.tamanho_letra"
              type="number"
              density="compact"
              hide-details
              variant="outlined"
              suffix="%"
              class="se-size-input"
              @change="markDirty"
            />
          </div>

          <div class="se-row">
            <span class="se-row-label">{{ t("labels.aux_text") }}</span>
            <input
              v-model="activeSlide.cor_letra_aux"
              type="color"
              :title="t('labels.color')"
              class="se-color-input"
              @change="markDirty"
            />
            <v-text-field
              v-model.number="activeSlide.tamanho_letra_aux"
              type="number"
              density="compact"
              hide-details
              variant="outlined"
              suffix="%"
              class="se-size-input"
              @change="markDirty"
            />
          </div>

          <v-checkbox
            v-model="transparentBg"
            :label="t('labels.transparent_bg')"
            density="compact"
            hide-details
            @update:model-value="markDirty"
          />

          <div class="se-row">
            <span class="se-row-label">{{ t("labels.replicate_bg") }}</span>
            <v-btn
              icon="mdi-arrow-right-bold"
              size="x-small"
              variant="text"
              :title="t('actions.replicate_bg_next')"
              @click="replicateBg('next')"
            />
            <v-btn
              icon="mdi-arrow-expand-right"
              size="x-small"
              variant="text"
              :title="t('actions.replicate_bg_after')"
              @click="replicateBg('after')"
            />
            <v-btn
              icon="mdi-format-line-spacing"
              size="x-small"
              variant="text"
              :title="t('actions.replicate_bg_all')"
              @click="replicateBg('all')"
            />
          </div>

          <div class="se-row">
            <span class="se-row-label">{{ t("labels.replicate_text") }}</span>
            <v-btn
              icon="mdi-arrow-right-bold"
              size="x-small"
              variant="text"
              :title="t('actions.replicate_text_next')"
              @click="replicateText('next')"
            />
            <v-btn
              icon="mdi-arrow-expand-right"
              size="x-small"
              variant="text"
              :title="t('actions.replicate_text_after')"
              @click="replicateText('after')"
            />
            <v-btn
              icon="mdi-format-line-spacing"
              size="x-small"
              variant="text"
              :title="t('actions.replicate_text_all')"
              @click="replicateText('all')"
            />
          </div>
        </details>

        <!-- Áudio player (sempre visível se há áudio) -->
        <div v-if="audioUrl" class="se-section se-audio-section">
          <div class="se-section-title">
            <v-icon size="14">mdi-music-note</v-icon>
            {{ song.audio_name }}
          </div>
          <audio
            ref="audioEl"
            :src="audioUrl"
            controls
            @play="audioPlaying = true"
            @pause="audioPlaying = false"
            @ended="audioPlaying = false"
            @timeupdate="onAudioTime"
            @loadedmetadata="onAudioLoad"
          />
        </div>
      </aside>
    </div>

    <input ref="fileSlja" type="file" accept=".slja,.lja" hidden @change="onLoadSlja" />
    <input ref="fileTxt" type="file" accept=".txt" hidden @change="onImportTxt" />
    <input ref="fileAudio" type="file" accept="audio/*" hidden @change="onPickAudio" />
    <input ref="fileImage" type="file" accept="image/*" hidden @change="onPickImage" />
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import SljaConverter from "@/helpers/SljaConverter";
import AudioLibrary from "@/helpers/AudioLibrary";
import CustomSongs from "@/helpers/CustomSongs";

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

const positionItems = computed(() =>
  Array.from({ length: 9 }, (_, i) => ({
    title: t(`positions.${i + 1}`),
    value: i + 1,
  }))
);

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

const mainTextStyle = computed(() => {
  const s = activeSlide.value;
  return {
    color: s.cor_letra,
    fontSize: `${s.tamanho_letra}cqh`,
    textAlign: s.text_align || "center",
    background: s.fundo_letra ? "rgba(0,0,0,0.55)" : "transparent",
  };
});

const auxTextStyle = computed(() => {
  const s = activeSlide.value;
  return {
    color: s.cor_letra_aux,
    fontSize: `${s.tamanho_letra_aux}cqh`,
    textAlign: s.text_align || "center",
    background: s.fundo_letra ? "rgba(0,0,0,0.55)" : "transparent",
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
  current.value = Math.max(0, Math.min(slides.value.length - 1, idx));
}

function onReorder() {
  markDirty();
}

watch(
  song,
  (val) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(val));
    } catch {
      /* noop */
    }
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

function onAudioTime() {
  if (!audioEl.value) return;
  audioCurrentTime.value = audioEl.value.currentTime;
}
function onAudioLoad() {
  if (!audioEl.value) return;
  audioDuration.value = audioEl.value.duration || 0;
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
  audio_attach: actAttachAudio,
  play_pause: togglePlay,
  record_advance: recordAdvance,
  record_start: recordStart,
  record_retroactive: recordRetroactive,
  record_clear: recordClear,
  image_set: actSetImage,
  image_remove: actRemoveImage,
  replicate_bg_all: () => replicateBg("all"),
  replicate_text_all: () => replicateText("all"),
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

function onClose() {
  if (dirty.value && !confirm(t("data.discard_changes"))) return;
  AudioLibrary.clearSession();
}

// ===== Ações =====

function actNew() {
  if (dirty.value && !confirm(t("data.discard_changes"))) return;
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
          text_align: "center",
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

async function actSave() {
  await CustomSongs.saveSong(song.value);
  dirty.value = false;
}

async function actSaveAs() {
  const name = prompt(t("actions.save_as"), song.value.nome || t("data.untitled"));
  if (!name) return;
  song.value.nome = name;
  await CustomSongs.saveSong(song.value);
  await downloadSlja(name);
  dirty.value = false;
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

function actProject() {
  const s = activeSlide.value;
  $broadcast.send(BROADCAST_TYPE.SLIDE_CHANGE, {
    slide_index: current.value,
    slide: { lyric: s.letra, url_image: null },
    next_slide: slides.value[current.value + 1]
      ? { lyric: slides.value[current.value + 1].letra }
      : null,
    title: song.value.nome,
    progress: 0,
    total_slides: slides.value.length,
  });
}

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
  if (slides.value.length <= 1) return;
  slides.value.splice(current.value, 1);
  current.value = Math.max(0, current.value - 1);
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

function togglePlay() {
  if (!audioEl.value) return;
  if (audioEl.value.paused) audioEl.value.play();
  else audioEl.value.pause();
}

function recordAdvance() {
  if (!audioEl.value || !audioPlaying.value) return;
  activeSlide.value.tempo_seconds = Math.round(audioEl.value.currentTime);
  if (current.value < slides.value.length - 1) current.value += 1;
  markDirty();
}

function recordStart() {
  if (!audioEl.value) return;
  activeSlide.value.tempo_seconds = Math.round(audioEl.value.currentTime);
  markDirty();
}

function recordRetroactive() {
  if (!audioEl.value || current.value === 0) return;
  const prev = slides.value[current.value - 1];
  if (!prev) return;
  prev.tempo_seconds = Math.round(audioEl.value.currentTime);
  markDirty();
}

function recordClear() {
  for (const s of slides.value) s.tempo_seconds = 0;
  markDirty();
}

function actSetImage() {
  fileImage.value.click();
}

async function onPickImage(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const token = await AudioLibrary.importImage(file, file.name);
  activeSlide.value.imagem = token;
  await nextTick();
  markDirty();
}

function actRemoveImage() {
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
  grid-template-columns: 200px 1fr 320px;
  height: 100%;
  min-height: 0;
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
  width: 100%;
  font-weight: 300;
  line-height: 1.2;
  white-space: pre-line;
  text-shadow: 0 0.2cqh 0.6cqh rgba(0, 0, 0, 0.7);
  padding: 0.4cqh 1cqh;
  border-radius: 0.4cqh;
}
.se-preview-text--aux {
  opacity: 0.92;
}

/* Editor side */
.se-editor-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-left: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.08);
  background: var(--lj-surface-bg, #fff);
  overflow-y: auto;
  min-height: 0;
}
.se-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.se-section-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.se-section-summary {
  cursor: pointer;
  user-select: none;
  list-style: none;
  padding-bottom: 2px;
}
.se-section-summary::-webkit-details-marker {
  display: none;
}
.se-textarea {
  width: 100%;
  resize: vertical;
  padding: 8px 10px;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.12s;
}
.se-textarea:focus {
  border-color: rgb(var(--v-theme-primary, 79, 70, 229));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary, 79, 70, 229), 0.12);
}
.se-textarea--aux {
  font-style: italic;
  opacity: 0.85;
}
.se-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.se-row-label {
  font-size: 11px;
  opacity: 0.6;
  min-width: 90px;
}
.se-color-input {
  width: 32px;
  height: 28px;
  border: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.2);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}
.se-size-input {
  max-width: 90px;
}
.se-audio-section {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(var(--v-border-color, 0, 0, 0), 0.06);
}
.se-audio-section audio {
  width: 100%;
}
.mt-2 {
  margin-top: 8px;
}
.mt-3 {
  margin-top: 12px;
}
</style>
