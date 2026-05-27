<template>
  <v-dialog v-model="open" max-width="760" transition="dialog-top-transition">
    <v-card class="music-search">
      <div class="music-search__bar">
        <v-icon icon="mdi-magnify" size="22" class="text-medium-emphasis" />
        <input
          ref="searchInput"
          v-model="search"
          class="music-search__input"
          type="text"
          :placeholder="t('placeholder')"
          autocomplete="off"
          spellcheck="false"
          @keydown.escape.prevent="open = false"
          @keydown.enter.prevent="pickFirst"
        />
        <v-btn
          v-if="search"
          icon="mdi-close"
          size="x-small"
          variant="text"
          density="compact"
          @click="search = ''"
        />
      </div>

      <v-divider />

      <div class="music-search__results">
        <div v-if="loading" class="music-search__state">
          <v-progress-circular indeterminate size="24" />
        </div>

        <div v-else-if="!filteredMusics.length" class="music-search__state text-medium-emphasis">
          <v-icon icon="mdi-music-note-outline" size="34" class="mb-2 text-disabled" />
          <div>{{ search ? t("empty_search") : t("empty") }}</div>
        </div>

        <table v-else class="music-search__table">
          <thead>
            <tr>
              <th class="text-left">{{ t("music") }}</th>
              <th class="text-left">{{ t("album") }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredMusics"
              :key="item.id_music"
              :class="{ 'music-search__row--pick': mode === 'pick' }"
              @click="mode === 'pick' && pickMusic(item)"
              @dblclick="pickMusic(item)"
            >
              <td>
                <strong>{{ item.name }}</strong>
              </td>
              <td class="text-medium-emphasis">
                {{ albumLabel(item) }}
              </td>
              <td>
                <div class="d-flex justify-end">
                  <button
                    v-if="mode === 'pick'"
                    type="button"
                    class="music-search__pick"
                    :title="t('select')"
                    @click.stop="pickMusic(item)"
                  >
                    <v-icon icon="mdi-play-box-multiple" size="16" />
                  </button>
                  <l-music-menu-table
                    v-else
                    :id_music="item.id_music"
                    :name="item.name"
                    :has_instrumental_music="item.has_instrumental_music"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <v-divider />

      <div class="music-search__footer">{{ filteredMusics.length }} {{ t("results") }}</div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import LMusicMenuTable from "@/components/MusicMenuTable.vue";
import Database from "@/helpers/Database";
import Strings from "@/helpers/Strings";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "execute" },
  musicsList: { type: Array, default: null },
});

const emit = defineEmits(["update:modelValue", "pick"]);

const { t: i18nT, locale } = useI18n();

const search = ref("");
const searchInput = ref(null);
const loading = ref(false);
const loadedLocale = ref(null);
const musics = ref([]);

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const sourceMusics = computed(() =>
  Array.isArray(props.musicsList) ? props.musicsList : musics.value
);

const filteredMusics = computed(() => {
  const query = Strings.clean(search.value);
  if (!query) return [];

  return sourceMusics.value
    .filter((music) => {
      return (
        Strings.clean(music.name).includes(query) ||
        Strings.clean(albumLabel(music)).includes(query) ||
        String(music.track || "").includes(query)
      );
    })
    .slice(0, 80);
});

function t(key) {
  return i18nT(`components.music_search.${key}`);
}

function albumLabel(music) {
  if (music.albums_names) return music.albums_names;
  if (music.album) return music.album;
  if (Array.isArray(music.albums)) {
    return music.albums
      .map((album) => {
        const track = album?.pivot?.track || album?.track;
        return [track, album?.name].filter(Boolean).join(" - ");
      })
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

async function loadMusics() {
  if (Array.isArray(props.musicsList)) return;
  if (loading.value || loadedLocale.value === locale.value) return;

  loading.value = true;
  try {
    const data = await Database.get(`${locale.value}_musics`);
    if (Array.isArray(data)) {
      musics.value = data.slice().sort((a, b) => Strings.sort(a.name, b.name));
      loadedLocale.value = locale.value;
    } else {
      musics.value = [];
    }
  } catch {
    musics.value = [];
  } finally {
    loading.value = false;
  }
}

function pickFirst() {
  const music = filteredMusics.value[0];
  if (music) pickMusic(music);
}

function pickMusic(music) {
  if (props.mode !== "pick") return;
  emit("pick", music);
  open.value = false;
}

watch(open, async (value) => {
  if (!value) return;
  search.value = "";
  await loadMusics();
  await nextTick();
  searchInput.value?.focus();
});

watch(
  () => locale.value,
  () => {
    if (!Array.isArray(props.musicsList)) {
      musics.value = [];
      loadedLocale.value = null;
    }
  }
);
</script>

<style scoped>
.music-search {
  background: var(--lj-popup-bg);
  color: var(--lj-text);
  display: flex;
  flex-direction: column;
  max-height: 72vh;
}

.music-search__bar {
  display: flex;
  align-items: center;
  gap: var(--lj-space-3);
  padding: var(--lj-space-5) var(--lj-space-6);
}

.music-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--lj-text);
  font-family: inherit;
  font-size: var(--lj-text-xl);
}

.music-search__input::placeholder {
  color: var(--lj-text-muted);
}

.music-search__results {
  flex: 1;
  overflow: auto;
  min-height: 180px;
}

.music-search__state {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--lj-space-6);
  text-align: center;
}

.music-search__table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: var(--lj-text-base);
}

.music-search__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: var(--lj-space-3) var(--lj-space-4);
  background: var(--lj-surface-bg-soft);
  color: var(--lj-text-muted);
  border-bottom: 1px solid var(--lj-surface-border-strong);
  font-size: var(--lj-text-xs);
  font-weight: var(--lj-weight-semibold);
  text-transform: uppercase;
}

.music-search__table td {
  padding: var(--lj-space-2) var(--lj-space-4);
  border-bottom: 1px solid var(--lj-surface-divider);
  vertical-align: middle;
}

.music-search__table tbody tr:hover {
  background: var(--lj-surface-bg-hover);
}

.music-search__row--pick {
  cursor: pointer;
}

.music-search__pick {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--lj-radius-sm);
  color: var(--lj-text-muted);
  cursor: pointer;
}

.music-search__pick:hover {
  background: var(--lj-active-bg);
  color: var(--lj-navy);
  border-color: var(--lj-navy);
}

.music-search__footer {
  padding: var(--lj-space-3) var(--lj-space-6);
  color: var(--lj-text-muted);
  font-size: var(--lj-text-sm);
  text-align: right;
}
</style>
