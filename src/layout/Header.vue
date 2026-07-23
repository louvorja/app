<template>
  <v-app-bar id="header-bar" tile flat color="primary">
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click="$appdata.toogle('menu.show')" />
    </template>
    <v-app-bar-title class="brand-font lj-app-title">{{ $t("app.name") }}</v-app-bar-title>
    <v-spacer />

    <v-bottom-sheet v-if="remote">
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn v-bind="activatorProps" icon="mdi-keyboard-close" />
      </template>

      <v-card>
        <v-card-actions>
          <v-btn icon="mdi-keyboard-esc" size="x-large" @click="sendKey(27)" />
        </v-card-actions>
        <v-card-actions>
          <v-spacer />
          <v-btn icon="mdi-page-first" size="x-large" @click="sendKey(36)" />
          <v-btn icon="mdi-chevron-left" size="x-large" @click="sendKey(37)" />
          <v-btn icon="mdi-play-pause" size="x-large" @click="sendKey(32)" />
          <v-btn icon="mdi-chevron-right" size="x-large" @click="sendKey(39)" />
          <v-btn icon="mdi-page-last" size="x-large" @click="sendKey(35)" />
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <v-tooltip v-if="remote" :text="remote_url">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon="mdi-remote" @click="openRemote()" />
      </template>
    </v-tooltip>

    <v-divider v-if="remote" vertical />

    <!-- Escolher tela de projeção e alternar layout só fazem sentido no PC
         que está de fato rodando a projeção — em celular/tablet só poluem o cabeçalho. -->
    <template v-if="!isMobile">
      <ScreenSelector />
      <MirrorPanel />
      <v-btn
        :icon="layout == 'apps' ? 'mdi-tab' : 'mdi-apps'"
        @click="changeLayout()"
      />
    </template>
    <LanguageSelector />
  </v-app-bar>
</template>

<script>
import LanguageSelector from "@/components/LanguageSelector.vue";
import ScreenSelector from "@/components/ScreenSelector.vue";
import MirrorPanel from "@/components/MirrorPanel.vue";

export default {
  name: "HeaderLayout",
  components: {
    LanguageSelector,
    ScreenSelector,
    MirrorPanel,
  },
  computed: {
    isMobile() {
      return this.$vuetify.display.width <= 600;
    },
    layout() {
      return this.$userdata.get("layout");
    },
    remote() {
      return this.$userdata.get("remote.is_connected");
    },
    remote_url() {
      return this.$userdata.get("remote.url");
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
    openRemote() {
      this.$modules.open("remote_control");
    },
    async sendKey(key) {
      const url =
        this.$userdata.get("remote.url") +
        "/api/keyboard?key=" +
        key +
        "&token=" +
        this.$userdata.get("remote.token");

      try {
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
        });

        const ret = await response.json();
        if (ret.status != "ok") {
          this.$alert.error({
            text:
              ret.code == "INVALID_TOKEN"
                ? "modules.remote_control.messages.invalid_token"
                : "modules.remote_control.messages.error",
            error: ret.code,
          });
        }
      } catch (error) {
        this.$alert.error({
          text: "modules.remote_control.messages.failed_to_connect",
          error: error,
        });
      }
    },
  },
};
</script>

<style scoped>
#header-bar {
  position: initial !important;
  flex: 0 !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding-top: var(--safe-top);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}

:deep(#header-bar .v-toolbar__content) {
  background: rgba(var(--v-theme-primary), 0.92);
}

.lj-app-title {
  letter-spacing: 0.02em;
}
</style>
