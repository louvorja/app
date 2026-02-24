```html
<template>
  <div id="ribbon-header" class="bg-primary">
    <!-- Top System Bar Style Row -->
    <div class="d-flex align-center px-2 py-1 top-bar">
      <v-btn
        icon="mdi-menu"
        variant="text"
        color="white"
        size="small"
        @click="$appdata.toogle('menu.show')"
        class="mr-2"
      />
      <span class="text-white font-weight-bold">{{ $t("app.name") }}</span>
      <v-spacer />
      <div class="toolbar-icons d-flex align-center gap-1">
        <v-btn icon="mdi-magnify" variant="text" size="x-small" color="white" />
        <v-btn icon="mdi-folder" variant="text" size="x-small" color="orange" />
        <v-btn icon="mdi-star" variant="text" size="x-small" color="yellow" />
        <v-btn icon="mdi-email" variant="text" size="x-small" color="white" />
        <v-btn
          icon="mdi-information"
          variant="text"
          size="x-small"
          color="blue-lighten-4"
        />
        <v-btn
          icon="mdi-help-circle"
          variant="text"
          size="x-small"
          color="white"
        />
        <LanguageSelector />
      </div>
    </div>

    <!-- Tabs Row -->
    <v-tabs
      v-model="active_group"
      bg-color="transparent"
      color="white"
      density="compact"
      hide-slider
      height="32"
      class="ribbon-tabs"
    >
      <v-tab
        v-for="(group, key) in module_groups"
        :key="key"
        :value="key"
        class="text-none font-weight-regular px-6 ribbon-tab"
        :ripple="false"
      >
        {{ $t(group.title) }}
      </v-tab>
    </v-tabs>
  </div>
</template>

<script>
import LanguageSelector from "@/components/LanguageSelector.vue";

export default {
  name: "HeaderLayout",
  components: {
    LanguageSelector,
  },
  computed: {
    module_groups() {
      return this.$modules.getGroups();
    },
    active_group: {
      get() {
        return this.$appdata.get("active_group");
      },
      set(value) {
        this.$appdata.set("active_group", value);
      },
    },
  },
};
</script>

<style scoped>
#ribbon-header {
  flex: 0 0 auto;
}

.top-bar {
  height: 36px;
  background-color: rgba(
    0,
    0,
    0,
    0.2
  ); /* Slightly darker overlay for better hierarchy */
}

.ribbon-tabs {
  height: 32px;
}

.ribbon-tab {
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 6px 6px 0 0 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-size: 0.85rem;
  height: 32px !important;
  min-width: 0 !important;
  transition: all 0.2s ease-in-out;
  margin-right: 4px;
}

.ribbon-tab.v-tab--selected {
  background-color: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: bold !important;
}

/* Specific adjustments for themes that might have low contrast */
.v-theme--dark .ribbon-tab.v-tab--selected {
  background-color: rgb(var(--v-theme-surface-bright)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.toolbar-icons .v-btn {
  margin-left: 2px;
}
</style>
```
