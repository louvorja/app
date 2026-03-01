<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <div v-for="(group, mode) in themes" :key="mode" class="mb-3">
      <div class="subtitle-1 font-weight-medium">
        {{ mode == "dark" ? t("dark-themes") : t("light-themes") }}
      </div>

      <v-btn
        v-for="(theme, theme_id) in group"
        :key="theme_id"
        icon
        density="compact"
        :variant="current == theme_id ? 'outlined' : 'text'"
        class="mx-1"
        @click="setTheme(theme_id)"
      >
        <v-avatar :color="theme.colors.primary" size="22" />
      </v-btn>
    </div>
  </ModuleContainer>
</template>

<script>
export default {
  name: manifest.id,
  data: () => ({
    current: {},
    themes: {},
  }),
  methods: {
    setTheme(theme_id) {
      this.current = theme_id;
      this.$vuetify.theme.change(this.current);
      this.$userdata.set("theme", this.current);
      this.$appdata.set("is_dark", this.$vuetify.theme.global.current.dark);
    },
  },
  mounted() {
    this.current = this.$vuetify.theme.global.name;
    this.themes = { light: {}, dark: {} };

    for (const key in this.$vuetify.theme.themes) {
      const item = this.$vuetify.theme.themes[key];
      if (item.dark) {
        this.themes.dark[key] = item;
      } else {
        this.themes.light[key] = item;
      }
    }
  },
};
</script>

<!-- ########################################################### -->
<!-- ####### SETUP OBRIGATÓRIA PARA INSTALAÇÃO DO MODULO ####### -->
<!-- ########################################################### -->
<script setup>
import manifest from "../manifest.json";
import ModuleContainer from "@/layout/ModuleContainer.vue";
import { ref } from "vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
</script>
<!-- ########################################################### -->
<!-- ########################################################### -->
<!-- ########################################################### -->
