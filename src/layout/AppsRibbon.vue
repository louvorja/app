<template>
  <v-card flat :rounded="0">
    <v-sheet color="red">
      <v-tabs v-model="tab" :bg-color="$theme.primary()" :border="0">
        <v-tab
          v-for="(group, group_key) in module_group"
          :key="group_key"
          :value="group_key"
          v-show="countModules(group.modules) != 0"
          show-arrows
          class="px-8"
        >
          {{ $t(group.title) }}
        </v-tab>
      </v-tabs>
    </v-sheet>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        v-for="(group, group_key) in module_group"
        :key="group_key"
        :value="group_key"
        v-show="countModules(group.modules) != 0"
      >
        <v-slide-group show-arrows>
          <v-slide-group-item
            v-for="(module, module_key) in sortModules(group.modules)"
            :key="module_key"
          >
            <v-card
              flat
              :rounded="0"
              v-if="
                module.language
                  ? module.language == language
                  : !module.development || (is_dev && module.development)
              "
              :color="
                module.invalid ? 'error' : module.development ? 'warning' : ''
              "
              @click="$modules.open(module_key)"
            >
              <v-card-text
                class="d-flex flex-column align-center justify-center h-100 pa-0 pt-1 px-2"
              >
                <v-icon :icon="module.icon" :size="40" style="flex: 1" />
                <v-card-title
                  class="text-center font-weight-light text-title-small"
                  style="text-wrap: initial"
                >
                  <small>{{ module.title ? $t(module.title) : "" }}</small>
                </v-card-title>
              </v-card-text>
            </v-card>
          </v-slide-group-item>
        </v-slide-group>
      </v-tabs-window-item>
    </v-tabs-window>
    <v-divider />
  </v-card>
</template>

<script>
export default {
  name: "AppsRibbonLayout",
  data: () => ({
    tab: null,
  }),
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
