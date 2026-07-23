<template>
  <v-navigation-drawer
    v-model="show"
    :location="$vuetify.display.width < 600 ? 'bottom' : undefined"
    temporary
  >
    <v-list :baseColor="$theme.primary()" nav>
      <template
        v-for="(module, module_key) in sortModules(menu_modules)"
        :key="module_key"
      >
        <v-list-item
          v-if="
            module.language
              ? module.language == language
              : !module.development || (is_dev && module.development)
          "
          :prepend-icon="module.icon"
          @click="
            $appdata.toogle('menu.show');
            $modules.open(module_key);
          "
        >
          <v-list-item-title>{{ $t(module.title) }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-list>

    <!-- No mobile o rodapé fica escondido (dá lugar à navegação
         inferior) — a versão fica aqui, abaixo da lista. -->
    <template v-if="isMobile">
      <v-divider class="mt-2" />
      <div class="d-flex align-center flex-wrap px-4 py-3">
        <span class="text-caption text-medium-emphasis">Versão {{ version }}</span>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
import packageJson from "../../package.json";

export default {
  name: "MenuLayout",
  data: () => ({
    db_version: 0,
  }),
  computed: {
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
    version() {
      return packageJson.version + "." + this.db_version;
    },
    show: {
      get() {
        return this.$appdata.get("menu.show");
      },
      set(value) {
        if (!value) {
          this.$appdata.toogle("menu.show");
        }
      },
    },
    menu_modules() {
      return this.$modules.getMenu();
    },
    modules() {
      return this.$appdata.get("modules");
    },
    is_dev: {
      get() {
        return this.$appdata.get("is_dev");
      },
      set(value) {
        if (!value) {
          this.$appdata.set("is_dev", value);
        }
      },
    },
    language: {
      get() {
        return this.$userdata.get("language");
      },
      set(value) {
        if (!value) {
          this.$userdata.set("language", value);
        }
      },
    },
  },
  methods: {
    sortModules(modules) {
      //Ordena pelo idioma selecionado
      return this.$modules.sort(modules, this.$t);
    },
    async loadDBVersion() {
      const config = await this.$database.get("config");
      this.db_version = config.version_number;
    },
  },
  async mounted() {
    await this.loadDBVersion();
  },
};
</script>
