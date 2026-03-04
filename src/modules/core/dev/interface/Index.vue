<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <template v-slot:header>
      <v-tabs v-model="tab" align-tabs="center" :color="$theme.primary()">
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
          <VueJsonPretty v-if="n == 2" :data="$appdata.get()" />
          <VueJsonPretty v-if="n == 3" :data="$userdata.get()" />
          <VueJsonPretty v-if="n == 4" :data="$vuetify" />
        </v-container>
      </v-tabs-window-item>
    </v-tabs-window>
  </ModuleContainer>
</template>

<script>
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import ModuleList from "../components/ModuleList.vue";

export default {
  name: manifest.id,
  components: {
    ModuleContainer,
    VueJsonPretty,
    ModuleList,
  },
  data: () => ({
    tab: null,
  }),
};
</script>

<!-- ########################################################### -->
<!-- ####### SETUP OBRIGATÓRIA PARA INSTALAÇÃO DO MODULO ####### -->
<!-- ########################################################### -->
<script setup>
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import { ref } from "vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
</script>
<!-- ########################################################### -->
<!-- ########################################################### -->
<!-- ########################################################### -->
