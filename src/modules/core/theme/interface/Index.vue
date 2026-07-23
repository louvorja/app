<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <v-switch
      v-model="autoTheme"
      color="primary"
      density="compact"
      hide-details
      :label="t('auto-theme')"
      class="mb-3"
    />
    <div class="text-caption text-medium-emphasis mb-4" style="margin-top: -8px">
      {{ t("auto-theme-hint") }}
    </div>

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

<script setup>
/* ########################################################### */
/* ####### INSTALAÇÃO DO MODULO ############################## */
/* ########################################################### */
defineOptions({ name: "ThemeIndex" });
import { ref, computed, getCurrentInstance, onMounted } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
/* ########################################################### */
/* ########################################################### */
/* ########################################################### */

const { proxy } = getCurrentInstance();

const current = ref("");
const themes = ref({
  light: {},
  dark: {},
});
const autoTheme = computed({
  get: () => proxy.$theme.isAutoEnabled(),
  set: (value) => {
    if (value) {
      proxy.$theme.enableAuto(proxy.$vuetify.theme);
    } else {
      proxy.$theme.disableAuto();
    }
    current.value = proxy.$vuetify.theme.global.name;
  },
});

/* ########################################################### */
/* ###################### METHODS ############################# */
/* ########################################################### */

function setTheme(theme_id) {
  current.value = theme_id;
  proxy.$vuetify.theme.change(current.value);
  proxy.$userdata.set("theme", current.value);
  proxy.$appdata.set("is_dark", proxy.$vuetify.theme.global.current.dark);
}

/* ########################################################### */
/* ###################### MOUNTED ############################# */
/* ########################################################### */

onMounted(() => {
  current.value = proxy.$vuetify.theme.global.name;
  themes.value = { light: {}, dark: {} };

  for (const key in proxy.$vuetify.theme.themes) {
    const item = proxy.$vuetify.theme.themes[key];

    if (item.dark) {
      themes.value.dark[key] = item;
    } else {
      themes.value.light[key] = item;
    }
  }
});
</script>
