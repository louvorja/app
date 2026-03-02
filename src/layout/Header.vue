<template>
  <v-app-bar id="header-bar" tile flat color="primary">
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click="$appdata.toogle('menu.show')" />
    </template>
    <v-app-bar-title>{{ $t("app.name") }}</v-app-bar-title>
    <v-spacer />
    <v-btn
      :icon="layout == 'apps' ? 'mdi-tab' : 'mdi-apps'"
      @click="changeLayout()"
    />
    <LanguageSelector />
  </v-app-bar>
</template>

<script>
import LanguageSelector from "@/components/LanguageSelector.vue";

export default {
  name: "HeaderLayout",
  components: {
    LanguageSelector,
  },
  computed: {
    layout() {
      return this.$userdata.get("layout");
    },
  },
  methods: {
    changeLayout() {
      if (this.layout == "apps") {
        this.$userdata.set("layout", "ribbon");
      } else {
        this.$userdata.set("layout", "apps");
      }
    },
  },
};
</script>

<style scoped>
#header-bar {
  position: initial !important;
  flex: 0 !important;
}
</style>
