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

<script setup>
/* ########################################################### */
/* ####### INSTALAÇÃO DO MODULO ############################## */
/* ########################################################### */
import { ref, onMounted } from "vue";
import { useTheme } from "vuetify";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
/* ########################################################### */
/* ########################################################### */
/* ########################################################### */

const vuetifyTheme = useTheme();

const current = ref("");
const themes = ref({
  light: {},
  dark: {},
});

/* ########################################################### */
/* ###################### METHODS ############################# */
/* ########################################################### */

function setTheme(theme_id) {
  current.value = theme_id;
  vuetifyTheme.global.name.value = current.value;
  $userdata.set("theme", current.value);
  $appdata.set("is_dark", vuetifyTheme.global.current.value.dark);
}

/* ########################################################### */
/* ###################### MOUNTED ############################# */
/* ########################################################### */

onMounted(() => {
  current.value = vuetifyTheme.global.name.value;
  themes.value = { light: {}, dark: {} };

  for (const key in vuetifyTheme.themes.value) {
    const item = vuetifyTheme.themes.value[key];

    if (item.dark) {
      themes.value.dark[key] = item;
    } else {
      themes.value.light[key] = item;
    }
  }
});
</script>
