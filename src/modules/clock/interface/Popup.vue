<template>
  <Screen />
</template>

<script>
import manifest from "../manifest.json";
import Modules from "@/helpers/Modules";
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
      return Modules.get(this.module_id);
    },
    /* COMPUTEDS OBRIGATÓRIAS - FIM */
  },
};
</script>
