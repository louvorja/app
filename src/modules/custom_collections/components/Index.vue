<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest" @show="onShow" @close="onClose">
    <template #header>
      <div class="d-flex align-center pa-2" style="gap: 8px; width: 100%">
        <v-tabs v-model="activeTab" :color="primaryColor" density="compact">
          <v-tab value="songs">{{ t("tabs.songs") }}</v-tab>
          <v-tab value="collections">{{ t("tabs.collections") }}</v-tab>
        </v-tabs>
        <v-spacer />
        <template v-if="activeTab === 'songs'">
          <v-btn size="small" prepend-icon="mdi-plus" @click="actNewSong">
            {{ t("actions.new_song") }}
          </v-btn>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-import" @click="actImport">
            {{ t("actions.import") }}
          </v-btn>
        </template>
        <template v-else>
          <v-btn size="small" prepend-icon="mdi-plus" @click="actNewCollection">
            {{ t("actions.new_collection") }}
          </v-btn>
        </template>
      </div>
    </template>

    <!-- Aba: Músicas -->
    <div v-if="activeTab === 'songs'" class="pa-2">
      <div v-if="songs.length === 0" class="pa-6 text-center text-disabled">
        {{ t("data.empty_songs") }}
      </div>
      <div v-else class="d-flex flex-wrap" style="gap: 12px">
        <v-card
          v-for="s in songs"
          :key="s.id"
          width="240"
          class="cursor-pointer"
          @click="openInEditor(s)"
        >
          <div class="song-card-preview" :style="{ background: s.slides[0]?.cor_fundo || '#000' }">
            <div class="song-card-text" :style="{ color: s.slides[0]?.cor_letra || '#fff' }">
              {{ truncate(s.slides[0]?.letra || s.nome, 40) }}
            </div>
          </div>
          <v-card-title class="text-body-2 d-flex align-center">
            <span class="flex-1">{{ s.nome }}</span>
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon size="x-small" variant="text" v-bind="props" @click.stop>
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  :title="t('actions.edit')"
                  prepend-icon="mdi-pencil"
                  @click="openInEditor(s)"
                />
                <v-list-item
                  :title="t('actions.export')"
                  prepend-icon="mdi-download"
                  @click="exportSong(s)"
                />
                <v-list-item
                  :title="t('actions.rename')"
                  prepend-icon="mdi-rename"
                  @click="renameSong(s)"
                />
                <v-divider />
                <v-list-item
                  :title="t('actions.delete')"
                  prepend-icon="mdi-delete"
                  base-color="error"
                  @click="confirmDeleteSong(s)"
                />
              </v-list>
            </v-menu>
          </v-card-title>
          <v-card-subtitle class="pb-2 text-caption">
            {{ s.slides.length }} {{ t("labels.slides") }}
            <span v-if="s.audio_token">· {{ t("labels.audio") }}</span>
          </v-card-subtitle>
        </v-card>
      </div>
    </div>

    <!-- Aba: Coletâneas -->
    <div v-else class="d-flex h-100" style="min-height: 0">
      <div class="border-e" style="width: 240px; overflow-y: auto; flex-shrink: 0">
        <v-list density="compact">
          <v-list-item
            v-for="c in collections"
            :key="c.id"
            :title="c.nome"
            :subtitle="`${c.song_ids.length} ${t('labels.songs_count')}`"
            :active="selectedCollectionId === c.id"
            @click="selectedCollectionId = c.id"
          >
            <template #prepend>
              <div class="color-dot" :style="{ background: c.cor }" />
            </template>
            <template #append>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon size="x-small" variant="text" v-bind="props" @click.stop>
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    :title="t('actions.rename')"
                    prepend-icon="mdi-rename"
                    @click="renameCollection(c)"
                  />
                  <v-list-item
                    :title="t('actions.delete')"
                    prepend-icon="mdi-delete"
                    base-color="error"
                    @click="confirmDeleteCollection(c)"
                  />
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
        <div v-if="collections.length === 0" class="pa-4 text-caption text-disabled text-center">
          {{ t("data.empty_collections") }}
        </div>
      </div>

      <div class="flex-1 pa-2" style="overflow-y: auto">
        <div v-if="!selectedCollection" class="pa-6 text-center text-disabled">←</div>
        <template v-else>
          <div class="d-flex align-center mb-2">
            <h3 class="text-h6">{{ selectedCollection.nome }}</h3>
            <v-spacer />
            <v-menu>
              <template #activator="{ props }">
                <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" v-bind="props">
                  {{ t("actions.add_to_collection") }}
                </v-btn>
              </template>
              <v-list density="compact" max-height="400">
                <v-list-item
                  v-for="s in songsNotInSelected"
                  :key="s.id"
                  :title="s.nome"
                  @click="addSongToCollection(s.id)"
                />
                <v-list-item
                  v-if="songsNotInSelected.length === 0"
                  :title="t('data.empty_songs')"
                  disabled
                />
              </v-list>
            </v-menu>
          </div>

          <div v-if="selectedCollectionSongs.length === 0" class="pa-4 text-disabled text-center">
            {{ t("data.empty_collection_songs") }}
          </div>
          <draggable
            v-else
            v-model="selectedCollectionSongs"
            item-key="id"
            handle=".drag-handle"
            @end="persistCollectionOrder"
          >
            <template #item="{ element }">
              <v-list-item
                :title="element.nome"
                :subtitle="`${element.slides.length} ${t('labels.slides')}`"
                class="border-b"
                density="compact"
              >
                <template #prepend>
                  <v-icon class="drag-handle cursor-grab mr-2" size="small">
                    mdi-drag-vertical
                  </v-icon>
                </template>
                <template #append>
                  <v-btn icon size="small" variant="text" @click="openInEditor(element)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="removeSongFromCollection(element.id)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </template>
          </draggable>
        </template>
      </div>
    </div>

    <input ref="fileSlja" type="file" accept=".slja,.lja" multiple hidden @change="onImportSlja" />
    <v-snackbar v-model="importStatus.show" :color="importStatus.color" timeout="3000">
      {{ importStatus.text }}
    </v-snackbar>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import draggable from "vuedraggable";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import AppData from "@/helpers/AppData";
import Modules from "@/helpers/Modules";
import CustomSongs from "@/helpers/CustomSongs";
import SljaConverter from "@/helpers/SljaConverter";
import AudioLibrary from "@/helpers/AudioLibrary";

const SHARE_KEY = "slide_editor_song_v2";

const moduleContainer = ref(null);
const fileSlja = ref(null);

const activeTab = ref("songs");
const songs = ref([]);
const collections = ref([]);
const selectedCollectionId = ref(null);

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));
const t = (key) => moduleContainer.value?.t(key) || key;

const selectedCollection = computed(
  () => collections.value.find((c) => c.id === selectedCollectionId.value) || null
);

const selectedCollectionSongs = computed({
  get: () => {
    if (!selectedCollection.value) return [];
    return selectedCollection.value.song_ids
      .map((id) => songs.value.find((s) => s.id === id))
      .filter(Boolean);
  },
  set: async (val) => {
    if (!selectedCollection.value) return;
    selectedCollection.value.song_ids = val.map((s) => s.id);
    await CustomSongs.saveCollection(selectedCollection.value);
  },
});

const songsNotInSelected = computed(() => {
  if (!selectedCollection.value) return songs.value;
  const has = new Set(selectedCollection.value.song_ids);
  return songs.value.filter((s) => !has.has(s.id));
});

function truncate(text, max = 60) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 3) + "…" : text;
}

async function loadAll() {
  songs.value = await CustomSongs.listSongs();
  collections.value = await CustomSongs.listCollections();
  if (!selectedCollectionId.value && collections.value.length > 0) {
    selectedCollectionId.value = collections.value[0].id;
  }
}

function onShow(visible) {
  if (visible) loadAll();
}
function onClose() {}

onMounted(loadAll);

// ===== Songs =====

function openInEditor(s) {
  try {
    sessionStorage.setItem(SHARE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent("lj:open-song", { detail: s }));
  Modules.open("slide_editor");
}

async function actNewSong() {
  const nome = prompt(t("actions.new_song"), t("actions.new_song"));
  if (!nome) return;
  const s = CustomSongs.newSong(nome);
  await CustomSongs.saveSong(s);
  openInEditor(s);
  await loadAll();
}

async function renameSong(s) {
  const nome = prompt(t("actions.rename"), s.nome);
  if (!nome) return;
  s.nome = nome;
  await CustomSongs.saveSong(s);
  await loadAll();
}

async function confirmDeleteSong(s) {
  if (!confirm(t("data.confirm_delete_song"))) return;
  await CustomSongs.deleteSong(s.id);
  await loadAll();
}

async function exportSong(s) {
  const slidesForExport = [];
  const imagesMap = new Map();
  for (const slide of s.slides) {
    const exp = { ...slide };
    if (slide.imagem) {
      const blob = await AudioLibrary.getImageBlob(slide.imagem);
      if (blob) {
        const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
        const baseName = `${slide.id}.${ext}`;
        const path = `imagens/${baseName}`;
        if (!imagesMap.has(path)) imagesMap.set(path, blob);
        exp.imagem = path;
      } else {
        exp.imagem = "";
      }
    }
    slidesForExport.push(exp);
  }
  let audioBlob = null;
  if (s.audio_token) audioBlob = await AudioLibrary.getAudioBlob(s.audio_token);
  const blob = await SljaConverter.writeSlja({
    slides: slidesForExport,
    audio: audioBlob,
    audioName: s.audio_name || "audio.mp3",
    images: imagesMap,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${s.nome.replace(/[\\/:*?"<>|]/g, "_")}.slja`;
  a.click();
  URL.revokeObjectURL(url);
}

function actImport() {
  fileSlja.value.click();
}

const importStatus = ref({ show: false, text: "", color: "info" });

function showStatus(text, color = "info") {
  importStatus.value = { show: true, text, color };
}

async function importSljaFile(file) {
  const data = await SljaConverter.loadSlja(file);

  let audioToken = "";
  let audioName = "";
  if (data.audio) {
    audioName = (data.audioName || "audio.mp3").replace(/^audio\//, "");
    audioToken = await AudioLibrary.importAudio(data.audio, audioName);
  }
  const imgTokenByName = new Map();
  for (const [path, blob] of (data.images || new Map()).entries()) {
    const name = path.replace(/^(imagens|images)\//, "");
    const tok = await AudioLibrary.importImage(blob, name);
    imgTokenByName.set(name, tok);
    imgTokenByName.set(path, tok);
  }
  const newSong = {
    id: CustomSongs.newId("song"),
    nome: file.name.replace(/\.(slja|lja)$/i, ""),
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
  await CustomSongs.saveSong(newSong);
  return newSong;
}

async function onImportSlja(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";
  if (!files.length) return;

  let ok = 0;
  let fail = 0;
  for (const f of files) {
    try {
      await importSljaFile(f);
      ok++;
    } catch {
      fail++;
    }
  }
  await loadAll();
  showStatus(`${ok} importada(s)${fail ? `, ${fail} falha(s)` : ""}`, fail ? "warning" : "success");
}

// ===== Collections =====

async function actNewCollection() {
  const nome = prompt(t("actions.new_collection"), t("actions.new_collection"));
  if (!nome) return;
  const c = CustomSongs.newCollection(nome);
  await CustomSongs.saveCollection(c);
  await loadAll();
  selectedCollectionId.value = c.id;
}

async function renameCollection(c) {
  const nome = prompt(t("actions.rename"), c.nome);
  if (!nome) return;
  c.nome = nome;
  await CustomSongs.saveCollection(c);
  await loadAll();
}

async function confirmDeleteCollection(c) {
  if (!confirm(t("data.confirm_delete_collection"))) return;
  await CustomSongs.deleteCollection(c.id);
  if (selectedCollectionId.value === c.id) selectedCollectionId.value = null;
  await loadAll();
}

async function addSongToCollection(songId) {
  const c = selectedCollection.value;
  if (!c) return;
  if (!c.song_ids.includes(songId)) c.song_ids.push(songId);
  await CustomSongs.saveCollection(c);
  await loadAll();
}

async function removeSongFromCollection(songId) {
  const c = selectedCollection.value;
  if (!c) return;
  c.song_ids = c.song_ids.filter((id) => id !== songId);
  await CustomSongs.saveCollection(c);
  await loadAll();
}

async function persistCollectionOrder() {
  if (!selectedCollection.value) return;
  await CustomSongs.saveCollection(selectedCollection.value);
}
</script>

<style scoped>
.song-card-preview {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  overflow: hidden;
}
.song-card-text {
  font-size: 11px;
  text-align: center;
  white-space: pre-line;
  width: 100%;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
</style>
