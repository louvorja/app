<template>
  <div class="apps">
    <!-- Mobile: só a categoria escolhida na barra inferior, em grade
         responsiva — sem accordion empilhado (isso é o que fazia a tela
         inicial parecer um site encolhido, em vez de um app). -->
    <div v-if="isMobile" class="pa-2">
      <template v-if="activeGroup">
        <AppsGroupTiles
          :modules="activeGroup.modules"
          :group-key="activeGroupKey"
          :color="groupColor(activeGroupKey)"
          grid
        />
      </template>
    </div>

    <!-- Desktop: todas as categorias, em accordion -->
    <v-expansion-panels
      v-else
      v-model="panels_active"
      flat
      multiple
      :rounded="false"
      class="ma-0 pa-0"
    >
      <v-expansion-panel
        v-for="(group, group_key) in module_group"
        :key="group_key"
        class="ma-0 pa-0"
      >
        <v-expansion-panel-title
          v-if="countModules(group.modules) != 0"
          class="my-0 py-0"
        >
          {{ $t(group.title) }}
        </v-expansion-panel-title>
        <v-expansion-panel-text
          v-if="countModules(group.modules) != 0"
          class="ma-0 pa-0"
        >
          <v-container fluid class="ma-0 pa-0">
            <AppsGroupTiles
              :modules="group.modules"
              :group-key="group_key"
              :color="groupColor(group_key)"
            />
          </v-container>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
import AppsGroupTiles from "./AppsGroupTiles.vue";

export default {
  name: "AppsLayout",
  components: {
    AppsGroupTiles,
  },
  data: () => ({
    panels_active: [],
  }),
  watch: {
    module_group() {
      this.panels_active = Object.keys(this.module_group).map((_, key) => key);
    },
  },
  computed: {
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
    module_group() {
      return Object.entries(this.$modules.getGroups())
        .filter(([, value]) => Object.keys(value.modules).length > 0)
        .reduce((result, [key, value]) => {
          result[key] = value;
          return result;
        }, {});
    },
    activeGroupKey() {
      return this.$appdata.get("mobile_active_group") || Object.keys(this.module_group)[0];
    },
    activeGroup() {
      return this.module_group[this.activeGroupKey];
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
  },
  methods: {
    groupColor(group_key) {
      // Cores da identidade visual oficial (Manual Prático de Marca),
      // uma por categoria, para diferenciar os grupos na tela inicial.
      return (
        {
          musics: "#2f557f", // Denim
          bible: "#3e8391", // Ming
          planning: "#4b207f", // Emperor
          utilities: "#4d7549", // Cool
        }[group_key] || this.$theme.primary()
      );
    },
    countModules(modules) {
      return Object.keys(modules).filter((key) =>
        !this.is_dev
          ? !modules[key].development || modules[key].development === false
          : true,
      ).length;
    },
  },
  mounted() {
    this.panels_active = Object.keys(this.module_group).map((_, key) => key);
  },
};
</script>

<style scoped>
.apps {
  overflow: auto !important;
  width: 100%;
}
</style>
