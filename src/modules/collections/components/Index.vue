<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest" @show="show" @close="close">
    <template #header>
      <v-toolbar v-if="compact" color="transparent">
        <template #prepend>
          <v-menu>
            <template #activator="{ props }">
              <v-btn icon="$menu" v-bind="props" />
            </template>
            <v-list :color="primaryColor" class="d-flex flex-column h-100">
              <v-list-item
                v-for="category in categories"
                :key="category.id_category"
                :title="category.name"
                :active="id_category === category.id_category"
                @click="setCategory(category.id_category)"
              />

              <v-divider />

              <v-list-item
                class="mt-auto"
                :title="t('all_collections')"
                :active="id_category === 0"
                @click="setCategory(0)"
              />
            </v-list>
          </v-menu>
        </template>

        <v-toolbar-title
          v-if="!id_category || id_category == 0"
          class="text-h6"
          :text="t('all_collections')"
        />
        <v-toolbar-title
          v-else
          class="text-h6"
          :text="categories.find((c) => c.id_category == id_category).name"
        />

        <template #append>
          <v-btn icon="mdi-magnify" :title="t('music_search.title')" @click="openMusicSearch" />
        </template>
      </v-toolbar>
    </template>

    <template #left>
      <v-list v-if="!compact" :color="primaryColor" :width="200" class="d-flex flex-column h-100">
        <v-progress-linear v-if="loading" :color="primaryColor" indeterminate />
        <v-list-item
          prepend-icon="mdi-magnify"
          :title="t('music_search.title')"
          @click="openMusicSearch"
        />
        <v-divider />
        <v-list-item
          v-for="category in categories"
          :key="category.id_category"
          :title="category.name"
          :active="id_category === category.id_category"
          @click="setCategory(category.id_category)"
        />

        <v-list-item
          class="mt-auto"
          :title="t('all_collections')"
          :active="id_category === 0"
          @click="setCategory(0)"
        />
      </v-list>
    </template>

    <v-alert v-if="error" type="error" :text="error" variant="tonal" border="start" class="ma-2" />

    <div class="d-flex flex-wrap justify-center">
      <v-card
        v-for="album in albums"
        :key="album.id_album"
        :style="width > 350 ? 'min-width: 300px; max-width: 300px' : 'width:100%'"
        theme="dark"
        width="320"
        class="ma-2"
        :color="album.color || '#385F73'"
        dark
        @click="openAlbum(album.id_album)"
      >
        <div class="d-flex flex-no-wrap justify-space-between align-center">
          <v-avatar
            v-if="album.url_image"
            class="ma-3"
            :size="width > 350 ? 125 : 75"
            tile
            rounded="0"
          >
            <v-img :src="pathFile(album.url_image)" />
          </v-avatar>
          <div class="flex-grow-1 d-flex flex-column">
            <div class="text-h6 pt-2" v-text="album.name" />

            <div class="h6" v-text="album.subtitle" />
          </div>
        </div>
      </v-card>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import Strings from "@/helpers/Strings";
import Database from "@/helpers/Database";
import Modules from "@/helpers/Modules";
import Media from "@/composables/useMedia";
import AppData from "@/helpers/AppData";
import Path from "@/helpers/Path";
import { useShell } from "@/composables/useShell";

const { locale } = useI18n();
const { width } = useDisplay();
const shell = useShell();

const moduleContainer = ref(null);
const categories = ref([]);
const lang = ref(null);
const id_category = ref(null);
const loading = ref(false);
const error = ref(null);

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

const albums = computed(() => {
  if (!categories.value) return [];
  if (!id_category.value) {
    return [
      ...new Map(
        categories.value
          .reduce((acc, category) => acc.concat(category.albums), [])
          .map((album) => [album.id_album, { ...album, subtitle: null }])
      ).values(),
    ].sort((a, b) => Strings.sort(a.name, b.name));
  }
  return categories.value
    .filter((item) => item.id_category === id_category.value)[0]
    ?.albums.sort((a, b) => a.order - b.order);
});

const compact = computed(() => width.value <= 600);

const t = (key) => moduleContainer.value?.t(key) || key;
const pathFile = (img) => Path.file(img);

async function loadData() {
  id_category.value = null;
  categories.value = [];
  loading.value = true;

  categories.value = await Database.get(`${locale.value}_categories`);

  if (categories.value == null) {
    Modules.close(manifest.id);
    return;
  }

  if (categories.value.length > 0) {
    categories.value.sort((a, b) => a.order - b.order);
    id_category.value = categories.value[0].id_category;
  } else {
    id_category.value = 0;
  }

  lang.value = locale.value;
  loading.value = false;
}

function setCategory(id = null) {
  id_category.value = id;
}

function openAlbum(id_album) {
  Media.openAlbum(id_album);
}

function openMusicSearch() {
  shell.openMusicSearch();
}

async function show(value) {
  if (value && lang.value !== locale.value) {
    await loadData();
  } else if (value && categories.value.length > 0 && id_category.value === null) {
    id_category.value = categories.value[0].id_category;
  }
}

function close() {
  id_category.value = null;
}

onMounted(async () => {
  await loadData();
});
</script>
