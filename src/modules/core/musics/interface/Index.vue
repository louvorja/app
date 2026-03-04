<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    compact
    @close="close()"
    @scroll="onScroll"
    @hasScroll="hasScroll"
    :index="data.count"
  >
    <template v-slot:header>
      <div :class="classform.group">
        <div :class="classform.group_item" style="flex-basis: 600px">
          <Search
            v-model="search"
            :label="t('inputs.search')"
            :error="data.filter_count <= 0"
            :disabled="disabled"
            :disabled-hint="t('inputs.search_disabled')"
          />
        </div>
        <div :class="classform.group_item" style="flex-basis: 250px">
          <Checkbox
            v-model="userdata.search.name"
            :label="t('inputs.filter_name')"
          />
          <Checkbox
            v-model="userdata.search.lyric"
            :label="t('inputs.filter_lyric')"
          />
          <Checkbox
            v-model="userdata.search.album"
            :label="t('inputs.filter_album')"
          />
        </div>
        <v-divider vertical />
        <div :class="classform.group_item" style="flex-basis: 200px">
          <div>
            <Checkbox
              switch
              v-model="userdata.filter.instrumental_music"
              :label="t('inputs.filter_instrumental')"
            />
          </div>
        </div>
      </div>
    </template>

    <Table
      v-model="data"
      :search="search"
      :letter="letter"
      :searchable_fields="{
        name: search_name,
        lyric: search_lyric,
        albums_names: search_album,
      }"
      :filter="{ has_instrumental_music: filter_instrumental_music }"
      :scroll="scroll"
      :has_scroll="has_scroll"
      sort_by="name"
      :file="`${$i18n.locale}_musics`"
    >
      <thead>
        <tr>
          <th class="text-left">{{ t("table.music_name") }}</th>
          <th v-if="!compact" class="text-left">
            {{ t("table.album_name") }}
          </th>
          <th class="text-right">{{ t("table.duration") }}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data.data" :key="item.id_music">
          <td>
            {{ item.name }}
            <div v-if="compact" class="pb-1">
              <v-chip
                v-for="album in item.albums"
                :key="album.id_album"
                :color="$theme.primary()"
                size="x-small"
                @click="openAlbum(album.id_album)"
              >
                {{ album.name }}
              </v-chip>
            </div>
          </td>
          <td v-if="!compact">
            <v-chip
              v-for="album in item.albums"
              :key="album.id_album"
              :color="$theme.primary()"
              density="compact"
              @click="openAlbum(album.id_album)"
            >
              {{ album.name }}
            </v-chip>
          </td>
          <td class="text-right">{{ $datetime.shortTime(item.duration) }}</td>
          <td>
            <div class="d-flex justify-end">
              <MusicMenuTable
                :id_music="item.id_music"
                :has_instrumental_music="item.has_instrumental_music"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </Table>

    <v-alert
      v-if="search && data.filter_count <= 0"
      type="error"
      :text="t('data.not_found')"
      variant="tonal"
      border="start"
      class="ma-2"
    />

    <template v-slot:footer>
      <div class="w-100">
        <LetterPaginate v-model="letter" />
        <div class="text-right">
          <small>
            {{ t("data.records") }}:
            {{ data.filter_count }}
          </small>
        </div>
      </div>
    </template>
  </ModuleContainer>
</template>

<script setup>
/* ########################################################### */
/* ####### SETUP OBRIGATÓRIA PARA INSTALAÇÃO DO MODULO ####### */
/* ########################################################### */
import { ref, computed, getCurrentInstance } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
const userdata = computed(() => {
  return moduleContainer.value?.userdata;
});
const appdata = computed(() => {
  return moduleContainer.value?.appdata;
});
const { proxy } = getCurrentInstance();
/* ########################################################### */
/* ########################################################### */
/* ########################################################### */

import Table from "@/components/DataTable.vue";
import Search from "@/components/inputs/Search.vue";
import Checkbox from "@/components/inputs/CheckBox.vue";
import MusicMenuTable from "@/components/MusicMenuTable.vue";
import LetterPaginate from "@/components/LetterPagination.vue";

/* -------------------------------------------------- */
/* STATE                                              */
/* -------------------------------------------------- */
const search = ref("");
const data = ref([]);
const scroll = ref({});
const has_scroll = ref(false);
const letter = ref("");

/* -------------------------------------------------- */
/* COMPUTEDS                                          */
/* -------------------------------------------------- */
const search_name = computed(() => {
  return userdata.value.search.name;
});

const search_lyric = computed(() => {
  return userdata.value.search.lyric;
});

const search_album = computed(() => {
  return userdata.value.search.album;
});

const filter_instrumental_music = computed(() => {
  return userdata.value.filter.instrumental_music;
});

const disabled = computed(() => {
  return !search_name.value && !search_lyric.value && !search_album.value;
});

const classform = computed(() => ({
  group: "d-flex flex-wrap",
  group_item: "flex-shrink-1 flex-grow-1 d-flex flex-wrap justify-space-around",
}));

const compact = computed(() => {
  return proxy.$vuetify.display.width <= 800;
});

/* -------------------------------------------------- */
/* METHODS                                            */
/* -------------------------------------------------- */
function onScroll(value) {
  scroll.value = value;
}

function hasScroll(value) {
  has_scroll.value = value;
}

function openAlbum(id_album) {
  proxy.$media.openAlbum(id_album);
}

function close() {
  search.value = "";
}
</script>
