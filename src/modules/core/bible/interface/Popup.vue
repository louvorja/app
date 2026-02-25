<template>
  <Screen :config="bibleConfig" />
</template>

<script>
import manifest from "../manifest.json";

import Screen from "../components/Screen.vue";

export default {
  name: "PopupBiblePage",
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
    
    bibleConfig() {
      const savedConfig = this.$appdata.get(`modules.bible.config`);
      return savedConfig || {
        background: '#000000',
        textColor: '#ffffff',
        referenceColor: '#aaaaaa',
        textFontSize: 48,
        referenceFontSize: 32,
        fontFamily: 'Arial, sans-serif',
      };
    },
  },
};
</script>
