<template>
  <div class="main-container d-flex flex-column h-100">
    <AppSystemBar />
    <AppHeader />
    <Apps />
    <AppMenu />

    <div class="content-area flex-grow-1 d-flex flex-column position-relative bg-main overflow-hidden">
      <AppModuleTabs />
      <div class="flex-grow-1 position-relative overflow-hidden">
        <AppModules />
        <AppTrayArea class="tray-fixed" />
      </div>
      <AppAlert />
    </div>

    <AppFooter />
  </div>
</template>

<script>
import AppSystemBar from "@/layout/SystemBar.vue";
import AppHeader from "@/layout/Header.vue";
import AppFooter from "@/layout/Footer.vue";
import AppMenu from "@/layout/Menu.vue";
import AppModules from "@/layout/Modules.vue";
import AppAlert from "@/layout/Alert.vue";
import Apps from "@/layout/Apps.vue";
import AppTrayArea from "@/layout/TrayArea.vue";
import AppModuleTabs from "@/layout/ModuleTabs.vue";

export default {
  name: "MainPage",
  components: {
    AppSystemBar,
    AppHeader,
    AppFooter,
    AppMenu,
    AppModules,
    AppAlert,
    Apps,
    AppTrayArea,
    AppModuleTabs,
  },
  data() {
    return {
      isReady: false
    };
  },
  mounted() {
    // Carregar os dados salvos
    this.$userdata.load();

    // Carrega o tema
    let theme = this.$userdata.get("theme");
    if (theme != "") {
      this.$vuetify.theme.global.name = theme;
    }
    this.$appdata.set("is_dark", this.$vuetify.theme.global.current.dark);

    // Carrega o idioma
    let lang = this.$userdata.get("language");
    if (lang != "") {
      this.$i18n.locale = lang;
    } else {
      this.$userdata.set("language", this.$i18n.locale);
    }

    // Checa se está em modo de desenvolvimento
    let is_dev = import.meta.env.VITE_APP_MODE == "development";
    this.$appdata.set("is_dev", is_dev);

    // Checa as plataformas
    this.$appdata.set(
      "is_mobile",
      this.$vuetify.display.platform.android ||
        this.$vuetify.display.platform.ios
    );

    if (this.$vuetify.display.platform.electron) {
      this.$appdata.set("is_desktop", true);
    } else {
      this.$appdata.set("is_desktop", false);
      this.$appdata.set("is_online", true);
    }

    window.addEventListener("message", (event) => {
      if (event.origin === window.location.origin) {
        if (event.data == "mounted") {
          const popup = this.$appdata.get("popup");
          if (popup) {
            const data = this.$appdata.getFlatten();
            Object.keys(data).map((item) => {
              popup.postMessage(
                { param: item, value: data[item] },
                window.location.origin
              );
            });
          }
        }
      }
    });

    // Mark as ready to allow watchers to trigger window management AFTER initial load
    this.$nextTick(() => {
      setTimeout(() => {
        this.isReady = true;
      }, 500);
    });
  },
  watch: {
    "settings.operator.enabled"(val) {
      if (this.isReady && this.$appdata.get("is_desktop")) {
        if (val) this.$popup.open({ module: 'media', type: 'operator' });
        else if (window.electronAPI) window.electronAPI.closeWindow('operator');
      }
    },
    "settings.returnScreen.enabled"(val) {
      if (this.isReady && this.$appdata.get("is_desktop")) {
        if (val) this.$popup.open({ module: 'media', type: 'return' });
        else if (window.electronAPI) window.electronAPI.closeWindow('return');
      }
    }
  },
  computed: {
    settings() {
      return this.$userdata.get("settings");
    }
  },
  methods: {
    checkMultiMonitorScreens() {
      const settings = this.settings;
      if (settings?.operator?.enabled === true) {
        this.$popup.open({ module: 'media', type: 'operator' });
      }
      if (settings?.returnScreen?.enabled === true) {
        this.$popup.open({ module: 'media', type: 'return' });
      }
    }
  }
};
</script>

<style scoped>
.main-container {
  height: 100vh;
  overflow: hidden;
}

.bg-main {
  background-color: rgb(var(--v-theme-background));
}

.content-area {
  min-height: 0;
}

.tray-fixed {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 5;
}

:deep(main) {
  display: flex !important;
  flex: auto !important;
  align-items: stretch !important;
  --v-layout-top: 0 !important;
  padding-top: 0 !important;
  overflow: auto !important;
}
</style>
