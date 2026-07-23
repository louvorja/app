<template>
  <v-snackbar
    v-model="show"
    :timeout="-1"
    location="bottom"
    color="primary"
    class="lj-install-snackbar"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-cellphone-arrow-down" class="me-3" />
      <div class="flex-grow-1">
        <div class="text-body-2 font-weight-medium">{{ t("title") }}</div>
        <div class="text-caption" style="opacity: 0.85">{{ t(iosStep ? "ios_hint" : "hint") }}</div>
      </div>
    </div>

    <template v-slot:actions>
      <v-btn v-if="!iosStep" variant="text" @click="install">{{ t("install") }}</v-btn>
      <v-btn variant="text" @click="dismiss">{{ t("dismiss") }}</v-btn>
    </template>
  </v-snackbar>
</template>

<script>
const DISMISS_DAYS = 14;

export default {
  name: "InstallPrompt",
  data: () => ({
    show: false,
    deferredPrompt: null,
    iosStep: false,
  }),
  computed: {
    isMobile() {
      return this.$vuetify.display.width <= 900;
    },
  },
  methods: {
    t(text) {
      return this.$t(`components.install_prompt.${text}`);
    },
    isStandalone() {
      return (
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        window.navigator.standalone === true
      );
    },
    isIos() {
      return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    },
    dismissedRecently() {
      const dismissedAt = this.$userdata.get("install_prompt_dismissed_at");
      if (!dismissedAt) return false;
      const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      return days < DISMISS_DAYS;
    },
    async install() {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.show = false;
    },
    dismiss() {
      this.show = false;
      this.$userdata.set("install_prompt_dismissed_at", Date.now());
    },
  },
  mounted() {
    if (this.isStandalone() || !this.isMobile || this.dismissedRecently()) {
      return;
    }

    if (this.isIos()) {
      // iOS não dispara beforeinstallprompt — o único caminho é o usuário
      // usar o botão "Compartilhar" do Safari manualmente.
      this.iosStep = true;
      this.show = true;
      return;
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.show = true;
    });
  },
};
</script>

<style scoped>
.lj-install-snackbar :deep(.v-snackbar__wrapper) {
  margin-bottom: var(--safe-bottom);
}
</style>
