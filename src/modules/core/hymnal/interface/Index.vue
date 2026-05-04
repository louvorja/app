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
        <div :class="classform.group_item" style="flex-basis: 600px">
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
      :file="`${$i18n.locale}_hymnal`"
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

<script>
import manifest from "../manifest.json";

import ModuleContainer from "@/components/ModuleContainer.vue";
import LTable from "@/components/DataTable.vue";
import LSearch from "@/components/inputs/LjSearch.vue";
import LMusicMenuTable from "@/components/MusicMenuTable.vue";
import Modules from "@/helpers/Modules";
import UserData from "@/helpers/UserData";
import DateTime from "@/helpers/DateTime";

export default {
  name: "HymnalModule",
  components: {
    ModuleContainer,
    LTable,
    LSearch,
    LMusicMenuTable,
  },

  data: () => ({
    manifest,
    search: "",
    data: [],
    scroll: {},
    has_scroll: false,
  }),
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return Modules.get(this.module_id);
    },
    userdata() {
      return new Proxy(
        {},
        {
          get: (_, key) => {
            return UserData.get(`modules.${this.module.id}.${key}`, null);
          },
          set: (_, key, value) => {
            UserData.set(`modules.${this.module.id}.${key}`, value);
            return true;
          },
        }
      );
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */

    classform() {
      return {
        group: "d-flex flex-wrap",
        group_item: "flex-shrink-1 flex-grow-1 d-flex flex-wrap justify-space-around",
      };
    },
    compact: function () {
      return this.$vuetify.display.width <= 800;
    },
  },
  methods: {
    /* METHODS OBRIGATÓRIOS - INÍCIO */
    /* NÃO MODIFICAR */
    t(text) {
      return this.$t(`modules.${this.module_id}.${text}`);
    },
    /* METHODS OBRIGATÓRIOS - FIM */

    shortTime(d) {
      return DateTime.shortTime(d);
    },
    onScroll(data) {
      this.scroll = data;
    },
    hasScroll(data) {
      this.has_scroll = data;
    },
    close() {
      //Se fechar a janela, não manter o histórico de pesquisa.
      this.search = "";
    },
  },
};
</script>
