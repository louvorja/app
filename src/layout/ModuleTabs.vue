<template>
  <div class="module-tabs bg-surface" v-if="openModules.length > 0">
    <v-tabs
      v-model="activeModuleId"
      density="compact"
      class="tabs-container"
      hide-slider
      show-arrows
    >
      <v-tab
        v-for="module in openModules"
        :key="module.id"
        :value="module.id"
        class="module-tab"
        :class="{ 'active-tab': activeModuleId === module.id }"
        @click="$modules.setActive(module.id)"
      >
        <v-icon :icon="module.icon" size="small" class="mr-2" />
        <span class="text-truncate" style="max-width: 150px">
          {{ $t(module.title) }}
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="x-small"
          class="ml-2 close-btn"
          @click.stop="$modules.close(module.id)"
        />
      </v-tab>
    </v-tabs>
  </div>
</template>

<script>
export default {
  name: "ModuleTabs",
  computed: {
    activeModuleId: {
      get() {
        return this.$appdata.get("active_module_id");
      },
      set(value) {
        this.$modules.setActive(value);
      },
    },
    openModules() {
      const modules = this.$modules.get();
      return Object.keys(modules)
        .filter((id) => modules[id].show === true && !this.$modules.isFloating(id))
        .map((id) => ({ id, ...modules[id] }));
    },
  },
};
</script>

<style scoped>
.module-tabs {
  height: 36px;
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: flex;
  align-items: center;
  padding: 0 4px;
  z-index: 10;
}

.tabs-container {
  height: 36px;
  --v-tabs-height: 36px;
}

.module-tab {
  height: 32px !important;
  margin-top: 4px;
  min-height: 32px !important;
  text-transform: none !important;
  letter-spacing: 0.2px !important;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 8px 8px 0 0 !important;
  margin-right: 2px;
  min-width: 140px;
  max-width: 200px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: transparent !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
  opacity: 0.8;
}

.module-tab:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
  opacity: 1;
}

.active-tab {
  background-color: rgb(var(--v-theme-background)) !important;
  color: rgb(var(--v-theme-primary)) !important;
  opacity: 1;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-bottom: none;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.active-tab::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: rgb(var(--v-theme-background));
  z-index: 1;
}

.close-btn {
  opacity: 0;
  transition: all 0.2s;
  margin-right: -4px;
}

.module-tab:hover .close-btn,
.active-tab .close-btn {
  opacity: 0.6;
}

.close-btn:hover {
  opacity: 1 !important;
  background-color: rgba(var(--v-theme-error), 0.12) !important;
  color: rgb(var(--v-theme-error)) !important;
}

/* Hide the Vuetify default slider if any */
:deep(.v-tab__slider) {
  display: none !important;
}
</style>
