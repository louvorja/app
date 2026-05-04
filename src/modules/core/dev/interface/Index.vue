<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template #header>
      <v-tabs v-model="tab" align-tabs="center" :color="primaryColor">
        <v-tab :value="1">{{ t("modules") }}</v-tab>
        <v-tab :value="2">{{ t("global-variables") }}</v-tab>
        <v-tab :value="3">{{ t("user-variables") }}</v-tab>
        <v-tab :value="4">{{ t("vue-variables") }}</v-tab>
      </v-tabs>
    </template>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item v-for="n in 4" :key="n" :value="n">
        <v-container fluid>
          <ModuleList v-if="n == 1" />
          <VueJsonPretty v-if="n == 2" :data="allAppData()" />
          <VueJsonPretty v-if="n == 3" :data="allUserData()" />
          <VueJsonPretty v-if="n == 4" :data="vuetify" />
        </v-container>
      </v-tabs-window-item>
    </v-tabs-window>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDisplay, useTheme } from "vuetify";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import ModuleList from "../components/ModuleList.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import AppData from "@/helpers/AppData";
import UserData from "@/helpers/UserData";

const moduleContainer = ref(null);
const tab = ref(null);
const display = useDisplay();
const theme = useTheme();
const vuetify = { display, theme };

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

const t = (key) => moduleContainer.value?.t(key) || key;
const allAppData = () => AppData.get();
const allUserData = () => UserData.get();
</script>
