<template>
  <Screen />
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
  },
};
</script>
