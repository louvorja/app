<template>
  <AppLoading />
  <v-app id="app-container">
    <router-view />
  </v-app>
</template>

<script>
import AppLoading from "@/layout/Loading.vue";

export default {
  name: "App",
  components: { AppLoading },
};
</script>

<style>
#app-container > div {
  height: 100vh;
}
</style>
