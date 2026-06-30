<template>
  <AppLoading />
  <v-btn
    v-show="false"
    @shortkey="handleKeydown()"
    v-shortkey="['ctrl', 'alt', 'd']"
  />
  <v-app id="app-container">
    <router-view />
    <ChatFab key="v2" />
  </v-app>
</template>

<script>
import AppLoading from "@/layout/Loading.vue";
import ChatFab from "@/components/ChatFab.vue";

export default {
  name: "App",
  components: {
    AppLoading,
    ChatFab,
  },
  methods: {
    handleKeydown() {
      console.log("click ");
      //if (event.shiftKey && event.key === "A") {
      this.$dev.toogle();
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
