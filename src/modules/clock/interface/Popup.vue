<template>
  <Screen :config="clockConfig" />
</template>

<script>
import manifest from "../manifest.json";

import Screen from "../components/Screen.vue";

export default {
  name: "PopupClockPage",
  components: {
    Screen,
  },
  computed: {
    /* COMPUTEDS OBRIGATÓRIAS - INÍCIO */
    /* NÃO MODIFICAR */
    module_id() {
      return manifest.id;
    },
    module() {
      return this.$modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
    
    clockConfig() {
      const savedConfig = this.$appdata.get(`modules.clock.config`);
      return savedConfig || {
        format: 'hh:mm',
        background: '#000000',
        textColor: '#ffffff',
        fontSize: 96,
        fontFamily: 'Arial, sans-serif',
      };
    },
  },
};
</script>
