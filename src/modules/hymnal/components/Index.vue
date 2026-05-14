<template>
  <ModuleContainer
    :manifest="manifest"
    compact
    :index="data.count"
    @close="close()"
    @scroll="onScroll"
    @has-scroll="hasScroll"
  >
    <template #header>
      <div :class="classform.group">
        <div :class="classform.group_item">
          <l-search v-model="search" :label="t('inputs.search')" :error="data.filter_count <= 0" />
        </div>
      </div>
    </template>

    <l-table
      v-model="data"
      :search="search"
      letter=""
      :searchable_fields="{
        track: true,
        name: true,
      }"
      :scroll="scroll"
      :has_scroll="has_scroll"
      sort_by="track"
      :file="`${locale}_hymnal`"
    >
      <thead>
        <tr>
          <th class="text-right">{{ t("table.track") }}</th>
          <th class="text-left">{{ t("table.music_name") }}</th>
          <th class="text-right">{{ t("table.duration") }}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data.data" :key="item.id_music">
          <td class="text-right">
            {{ item.track }}
          </td>
          <td>
            {{ item.name }}
          </td>
          <td class="text-right">{{ shortTime(item.duration) }}</td>
          <td>
            <div class="d-flex justify-end">
              <l-music-menu-table
                :id_music="item.id_music"
                :name="item.name"
                :has_instrumental_music="item.has_instrumental_music"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </l-table>

    <v-alert
      v-if="search && data.filter_count <= 0"
      type="error"
      :text="t('data.not_found')"
      variant="tonal"
      border="start"
      class="ma-2"
    />

    <template #footer>
      <div class="w-100">
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
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import LTable from "@/components/DataTable.vue";
import LSearch from "@/components/inputs/LjSearch.vue";
import LMusicMenuTable from "@/components/MusicMenuTable.vue";
import DateTime from "@/helpers/DateTime";

const { t: i18nT, locale } = useI18n();
const moduleId = manifest.id;

const search = ref("");
const data = ref([]);
const scroll = ref({});
const has_scroll = ref(false);

const classform = computed(() => ({
  group: "d-flex flex-wrap",
  group_item: "flex-shrink-1 flex-grow-1 d-flex flex-wrap justify-space-around search-box",
}));

const t = (text) => i18nT(`modules.${moduleId}.${text}`);

function shortTime(d) {
  return DateTime.shortTime(d);
}

function onScroll(val) {
  scroll.value = val;
}

function hasScroll(val) {
  has_scroll.value = val;
}

function close() {
  search.value = "";
}
</script>

<style scoped>
.search-box {
  flex-basis: 600px;
  width: 350px;
  margin-top: 10px;
}
</style>
