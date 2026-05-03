<template>
  <AppLoading />
  <v-btn
    v-show="false"
    @shortkey="handleKeydown()"
    v-shortkey="['ctrl', 'alt', 'd']"
  />
  <v-app id="app-container">
    <router-view />
  </v-app>
</template>

<script>
import AppLoading from "@/layout/Loading.vue";

export default {
  name: "App",
  components: {
    AppLoading,
  },
  methods: {
    handleKeydown() {
      console.log("click ");
      //if (event.shiftKey && event.key === "A") {
      this.$dev.toggle();
      //}
    },
  },
};
</script>

<style>
#app-container > div {
  height: 100vh;
}
</style>
