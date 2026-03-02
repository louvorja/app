<template>
  <div class="apps">
    <v-expansion-panels
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
            <v-row class="ma-0 pa-0" style="gap: 5px">
              <template
                v-for="(module, module_key) in sortModules(group.modules)"
                :key="module_key"
              >
                <v-card
                  v-if="
                    module.language
                      ? module.language == language
                      : !module.development || (is_dev && module.development)
                  "
                  :color="
                    module.invalid
                      ? 'error'
                      : module.development
                        ? 'warning'
                        : $theme.primary()
                  "
                  @click="$modules.open(module_key)"
                  class="ma-1"
                  :width="140"
                >
                  <v-card-text
                    class="d-flex flex-column align-center justify-center h-100 px-0"
                  >
                    <v-icon
                      :icon="module.icon"
                      color="#FFFFFF"
                      :size="40"
                      style="flex: 1"
                    />
                    <v-card-title
                      class="text-center font-weight-light text-title-small"
                      style="text-wrap: initial"
                    >
                      <small>{{ module.title ? $t(module.title) : "" }}</small>
                    </v-card-title>
                  </v-card-text>
                </v-card>
              </template>
            </v-row>
          </v-container>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script>
export default {
  name: "AppsLayout",
  data: () => ({
    panels_active: [],

    selectedTheme: "",
    themes: [],
  }),
  watch: {
    module_group() {
      this.panels_active = Object.keys(this.module_group).map((_, key) => key);
    },
  },
  computed: {
    module_group() {
      return Object.entries(this.$modules.getGroups())
        .filter(([, value]) => Object.keys(value.modules).length > 0)
        .reduce((result, [key, value]) => {
          result[key] = value;
          return result;
        }, {});
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
    countModules(modules) {
      return Object.keys(modules).filter((key) =>
        !this.is_dev
          ? !modules[key].development || modules[key].development === false
          : true,
      ).length;
    },
  },
};
</script>

<style scoped>
.apps {
  overflow: auto !important;
  width: 100%;
}
</style>
