<template>
  <AppLoading />
  <v-btn
    v-show="false"
    @shortkey="handleKeydown()"
    v-shortkey="['ctrl', 'alt', 'd']"
  />
  <v-app id="app-container">
    <router-view />
    <ChatFab v-if="$route.name !== 'Popup'" key="v2" />
    <MirrorPublisher v-if="$route.name !== 'Popup'" />
  </v-app>
</template>

<script>
import AppLoading from "@/layout/Loading.vue";
import ChatFab from "@/components/ChatFab.vue";
import MirrorPublisher from "@/components/MirrorPublisher.vue";

export default {
  name: "App",
  components: {
    AppLoading,
    ChatFab,
    MirrorPublisher,
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
