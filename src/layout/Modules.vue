<template>
  <div v-if="import_modules" class="h-100 w-100 flex-grow-1">
    <!-- Módulos em Abas -->
    <v-tabs-window v-model="activeModuleId" class="h-100 w-100">
      <v-tabs-window-item
        v-for="module in tabbedModules"
        :key="module.id"
        :value="module.id"
        class="h-100 w-100"
      >
        <component
          :is="loadModuleComponent(module)"
          class="module-viewer h-100"
        />
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- Módulos Flutuantes (Modais) -->
    <div class="floating-modules" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100;">
      <component
        v-for="module in floatingModules"
        :key="module.id"
        :is="loadModuleComponent(module)"
        v-show="module.show"
        style="pointer-events: auto;"
      />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";

export default {
  name: "ModulesLayout",
  computed: {
    modules() {
      return this.$modules.get();
    },
    import_modules() {
      return this.$appdata.get("import_modules");
    },
    activeModuleId: {
      get() {
        return this.$appdata.get("active_module_id");
      },
      set(value) {
        this.$modules.setActive(value);
      },
    },
    tabbedModules() {
      const allModules = this.$modules.get();
      return Object.keys(allModules)
        .filter((id) => allModules[id].show === true && !this.$modules.isFloating(id))
        .map((id) => ({ id, ...allModules[id] }));
    },
    floatingModules() {
      const allModules = this.$modules.get();
      return Object.keys(allModules)
        .filter((id) => allModules[id].show === true && this.$modules.isFloating(id))
        .map((id) => ({ id, ...allModules[id] }));
    },
  },
  methods: {
    loadModuleComponent(module) {
      return defineAsyncComponent(() => {
        // Try to load from modules interface directory
        return import(`@/modules/core/${module.id}/interface/Index.vue`).catch(
          () => {
            // Try to load from CUSTOM module interface directory
            return import(`@/modules/${module.id}/interface/Index.vue`).catch((e) => {
              this.$alert.error({
                text: "messages.error_import_module",
                error: e,
              });

              return null
            });
          }
        );
      });
    },
  },
};
</script>
