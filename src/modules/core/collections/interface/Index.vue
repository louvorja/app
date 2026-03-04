<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    @show="show"
    @close="close"
  >
    <template v-slot:header>
      <v-toolbar color="transparent" v-if="compact">
        <template v-slot:prepend>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon="$menu" v-bind="props" />
            </template>
            <v-list :color="$theme.primary()" class="d-flex flex-column h-100">
              <v-list-item
                v-for="category in categories"
                :key="category.id_category"
                :title="category.name"
                :active="id_category == category.id_category"
                @click="setCategory(category.id_category)"
              />

              <v-divider />

              <v-list-item
                class="mt-auto"
                :title="t('all_collections')"
                :active="id_category == 0"
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
      </v-toolbar>
    </template>

    <template v-slot:left>
      <v-list
        v-if="!compact"
        :color="$theme.primary()"
        :width="200"
        class="d-flex flex-column h-100"
      >
        <v-progress-linear
          :color="$theme.primary()"
          indeterminate
          v-if="loading"
        />
        <v-list-item
          v-for="category in categories"
          :key="category.id_category"
          :title="category.name"
          :active="id_category == category.id_category"
          @click="setCategory(category.id_category)"
        />

        <v-list-item
          class="mt-auto"
          :title="t('all_collections')"
          :active="id_category == 0"
          @click="setCategory(0)"
        />
      </v-list>
    </template>

    <v-alert
      v-if="error"
      type="error"
      :text="error"
      variant="tonal"
      border="start"
      class="ma-2"
    />

    <div class="d-flex flex-wrap justify-center">
      <v-card
        :style="
          $vuetify.display.width > 350
            ? 'min-width: 300px; max-width: 300px'
            : 'width:100%'
        "
        theme="dark"
        v-for="album in albums"
        :key="album.id_album"
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
            :size="$vuetify.display.width > 350 ? 125 : 75"
            tile
            rounded="0"
          >
            <v-img :src="$path.file(album.url_image)" />
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

<script>
export default {
  name: manifest.id,
  data: () => ({
    categories: [],
    lang: null,
    id_category: null,
    loading: false,
    error: null,
  }),
  computed: {
    /*show() {
      let module = this.$modules.get(manifest.id);
      return module.show;
    },*/
    albums() {
      if (!this.categories) {
        return [];
      }
      if (!this.id_category) {
        return [
          ...new Map(
            this.categories
              .reduce((acc, category) => acc.concat(category.albums), [])
              .map((album) => [album.id_album, { ...album, subtitle: null }]),
          ).values(),
        ].sort((a, b) => this.$string.sort(a.name, b.name));
      }

      return this.categories
        .filter((item) => item.id_category == this.id_category)[0]
        ?.albums.sort((a, b) => a.order - b.order);
    },
    compact: function () {
      return this.$vuetify.display.width <= 600;
    },
  },
  methods: {
    async loadData() {
      this.id_category = null;
      this.categories = [];
      this.loading = true;

      this.categories = await this.$database.get(
        `${this.$i18n.locale}_categories`,
      );

      if (this.categories == null) {
        this.$modules.close(this.module_id);
        return;
      }

      if (this.categories.length > 0) {
        this.categories.sort((a, b) => a.order - b.order);
        this.id_category = this.categories[0].id_category;
      } else {
        this.id_category = 0;
      }

      this.lang = this.$i18n.locale;
      this.loading = false;
    },
    setCategory(id = null) {
      this.id_category = id;
    },
    openAlbum(id_album) {
      this.$media.openAlbum(id_album);
    },
    async show(value) {
      if (value && this.lang != this.$i18n.locale) {
        await this.loadData();
      } else if (
        value &&
        this.categories.length > 0 &&
        this.id_category == null
      ) {
        this.id_category = this.categories[0].id_category;
      }
    },
    close() {
      //Se fechar a janela, não manter o histórico.
      this.id_category = null;
    },
  },
  async mounted() {
    await this.loadData();
  },
};
</script>

<!-- ########################################################### -->
<!-- ####### SETUP OBRIGATÓRIA PARA INSTALAÇÃO DO MODULO ####### -->
<!-- ########################################################### -->
<script setup>
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import { ref } from "vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
</script>
<!-- ########################################################### -->
<!-- ########################################################### -->
<!-- ########################################################### -->
