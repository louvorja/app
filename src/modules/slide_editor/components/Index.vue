<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest" @close="close()">
    <template #header>
      <div class="d-flex align-center pa-2" style="gap: 6px; flex-wrap: wrap">
        <v-btn size="small" :color="primaryColor" prepend-icon="mdi-plus" @click="addSlide">
          {{ t("actions.add_slide") }}
        </v-btn>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-content-save-outline" @click="save">
          {{ t("actions.save") }}
        </v-btn>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-folder-open-outline" @click="load">
          {{ t("actions.load") }}
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="slides.length"
          size="small"
          color="success"
          prepend-icon="mdi-presentation-play"
          @click="present"
        >
          {{ t("actions.present") }}
        </v-btn>
      </div>
    </template>

    <div v-if="slides.length === 0" class="pa-6 text-center text-disabled">
      {{ t("data.empty") }}
    </div>

    <div v-else class="d-flex h-100" style="min-height: 0">
      <!-- Lista de slides (esquerda) -->
      <div class="slide-list border-e" style="width: 160px; overflow-y: auto; flex-shrink: 0">
        <div
          v-for="(slide, i) in slides"
          :key="slide.id"
          class="slide-thumb cursor-pointer"
          :class="{ 'slide-thumb--active': i === current }"
          :style="{ background: slide.bg_color }"
          @click="current = i"
        >
          <div
            class="slide-thumb-text"
            :style="{
              color: slide.text_color,
              fontSize: '9px',
              textAlign: slide.text_align || 'center',
            }"
            v-html="slide.text || '(vazio)'"
          />
          <div class="slide-thumb-num">{{ i + 1 }}</div>
        </div>
      </div>

      <!-- Área de edição (direita) -->
      <div class="flex-1 d-flex flex-column" style="min-width: 0; overflow: hidden">
        <!-- Preview -->
        <div
          class="slide-preview"
          :style="{
            background: activeSlide.bg_color,
            backgroundImage: activeSlide.image_url ? `url(${activeSlide.image_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }"
        >
          <div
            class="slide-preview-text"
            :style="{
              color: activeSlide.text_color,
              fontSize: activeSlide.font_size + 'px',
              textAlign: activeSlide.text_align || 'center',
            }"
            v-html="activeSlide.text || ''"
          />
        </div>

        <!-- Ferramentas -->
        <div class="pa-3 border-t" style="overflow-y: auto">
          <div class="d-flex flex-column" style="gap: 10px">
            <v-textarea
              v-model="activeSlide.text"
              :label="t('inputs.text')"
              rows="3"
              auto-grow
              density="compact"
              hide-details
              variant="outlined"
            />
            <div class="d-flex align-center" style="gap: 8px">
              <v-text-field
                v-model.number="activeSlide.font_size"
                type="number"
                :label="t('inputs.font_size')"
                density="compact"
                hide-details
                style="flex: 1"
                suffix="px"
              />
              <!-- Alinhamento -->
              <v-btn-toggle v-model="activeSlide.text_align" mandatory density="compact">
                <v-btn value="left" icon="mdi-format-align-left" size="small" />
                <v-btn value="center" icon="mdi-format-align-center" size="small" />
                <v-btn value="right" icon="mdi-format-align-right" size="small" />
              </v-btn-toggle>
            </div>
            <div class="d-flex align-center" style="gap: 8px">
              <span class="text-caption">{{ t("inputs.text_color") }}</span>
              <input
                v-model="activeSlide.text_color"
                type="color"
                :aria-label="t('inputs.text_color')"
                style="width: 40px; height: 32px; cursor: pointer; border: none; background: none"
              />
              <span class="text-caption ml-2">{{ t("inputs.bg_color") }}</span>
              <input
                v-model="activeSlide.bg_color"
                type="color"
                :aria-label="t('inputs.bg_color')"
                style="width: 40px; height: 32px; cursor: pointer; border: none; background: none"
              />
            </div>
            <v-text-field
              v-model="activeSlide.image_url"
              :label="t('inputs.image_url')"
              density="compact"
              hide-details
              variant="outlined"
              clearable
            />
            <v-btn
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete-outline"
              @click="removeSlide"
            >
              {{ t("actions.remove_slide") }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json,.slja"
      style="display: none"
      @change="onFileLoad"
    />
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";
import AppData from "@/helpers/AppData";

const SESSION_KEY = "slide_editor_slides";

let idCounter = Date.now();
function newSlide() {
  return {
    id: idCounter++,
    text: "",
    font_size: 48,
    text_color: "#ffffff",
    bg_color: "#000000",
    image_url: "",
    text_align: "center",
  };
}

function isValidSchema(data) {
  return (
    Array.isArray(data) && data.every((s) => typeof s === "object" && s !== null && "text" in s)
  );
}

const moduleContainer = ref(null);
const fileInput = ref(null);
const slides = ref([]);
const current = ref(0);

const activeSlide = computed(() => slides.value[current.value] ?? newSlide());
const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

const t = (key) => moduleContainer.value?.t(key) || key;

watch(
  slides,
  (val) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(val));
    } catch {
      /* noop */
    }
  },
  { deep: true }
);

onMounted(() => {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (isValidSchema(data)) {
        slides.value = data.map((s) => ({ text_align: "center", ...s }));
      }
    }
  } catch {
    /* noop */
  }
});

function addSlide() {
  slides.value.push(newSlide());
  current.value = slides.value.length - 1;
}

function removeSlide() {
  if (!slides.value.length) return;
  slides.value.splice(current.value, 1);
  current.value = Math.max(0, current.value - 1);
}

function present() {
  const slide = activeSlide.value;
  $broadcast.send(BROADCAST_TYPE.SLIDE_CHANGE, {
    slide_index: current.value,
    slide: { lyric: slide.text, url_image: slide.image_url || null },
    next_slide: slides.value[current.value + 1]
      ? { lyric: slides.value[current.value + 1].text }
      : null,
    title: "Editor",
    progress: 0,
    total_slides: slides.value.length,
  });
}

function save() {
  const blob = new Blob([JSON.stringify(slides.value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "slides.json";
  a.click();
  URL.revokeObjectURL(url);
}

function load() {
  fileInput.value.click();
}

function onFileLoad(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.name.endsWith(".slja")) {
    loadSljaFile(file, e);
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (isValidSchema(data)) {
        slides.value = data.map((s) => ({ text_align: "center", ...s }));
        current.value = 0;
      } else {
        alert(t("data.invalid_file"));
      }
    } catch {
      alert(t("data.invalid_file"));
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

async function loadSljaFile(file, e) {
  try {
    const SljaConverter = (await import("@/helpers/SljaConverter")).default;
    const result = await SljaConverter.loadSlja(file);
    slides.value = result.slides.map((s, i) => ({
      id: Date.now() + i,
      text: s.letra,
      font_size: s.tamanho_letra,
      text_color: s.cor_letra,
      bg_color: s.cor_fundo,
      image_url: s.imagem || "",
      text_align: "center",
    }));
    current.value = 0;
  } catch (err) {
    alert(t("data.invalid_file") + "\n\n" + err.message);
  } finally {
    if (e) e.target.value = "";
  }
}

function close() {}
</script>

<style scoped>
.slide-list {
  background: rgba(0, 0, 0, 0.04);
}
.slide-thumb {
  position: relative;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 6px;
  transition: opacity 0.15s;
}
.slide-thumb--active {
  outline: 2px solid #4f46e5;
  outline-offset: -2px;
}
.slide-thumb-text {
  text-align: center;
  overflow: hidden;
  max-height: 70px;
  width: 100%;
}
.slide-thumb-num {
  position: absolute;
  bottom: 3px;
  right: 5px;
  font-size: 9px;
  opacity: 0.5;
}
.slide-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px;
}
.slide-preview-text {
  font-weight: 300;
  line-height: 1.4;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
  width: 100%;
}
</style>
