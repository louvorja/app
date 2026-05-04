<template>
  <AppLoading />
  <v-app id="app-container">
    <router-view />
  </v-app>
</template>

<script setup>
import AppLoading from "@/layout/Loading.vue";
</script>

<style>
#app-container > div {
  height: 100vh;
}
</style>
