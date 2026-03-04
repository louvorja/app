<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <div class="subtitle-1 font-weight-medium mb-1">
      {{ t("settings.popup_title") }}
    </div>

    <v-switch
      v-model="multiple_popups"
      :label="t('settings.multiple_popups')"
      :hint="t('settings.multiple_popups_help')"
      persistent-hint
      color="primary"
      density="compact"
    />
  </ModuleContainer>
</template>

<script>
export default {
  name: manifest.id,
  computed: {
    multiple_popups: {
      get() {
        return this.$userdata.get("multiple_popups", false);
      },
      set(value) {
        this.$userdata.set("multiple_popups", value);
      },
    },
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
