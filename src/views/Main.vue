<template>
  <AppSystemBar />
  <AppHeader />
  <AppMenu />

  <AppModules />
  <AppAlert />

  <AppsRibbon v-if="this.$userdata.get('layout') == 'ribbon'" />

  <v-main v-if="this.$userdata.get('layout') !== 'ribbon'" class="bg-main">
    <Apps />
    <AppTrayArea />
  </v-main>
  <v-main class="d-flex flex-column" v-else>
    <v-sheet
      :color="$theme.primary()"
      width="100%"
      height="100%"
      class="d-flex align-center justify-center"
    >
      <img src="@/assets/imgs/logo.svg" />
    </v-sheet>
    <AppTrayArea horizontal />
  </v-main>

  <AppFooter />
</template>

<script>
import AppSystemBar from "@/layout/SystemBar.vue";
import AppHeader from "@/layout/Header.vue";
import AppFooter from "@/layout/Footer.vue";
import AppMenu from "@/layout/Menu.vue";
import AppModules from "@/layout/Modules.vue";
import AppAlert from "@/layout/Alert.vue";
import Apps from "@/layout/Apps.vue";
import AppsRibbon from "@/layout/AppsRibbon.vue";
import AppTrayArea from "@/layout/TrayArea.vue";

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
    AppsRibbon,
    AppTrayArea,
  },
  mounted() {
    //Carregar os dados salvos
    this.$userdata.load();

    //Carrega o tema
    let theme = this.$userdata.get("theme");
    if (theme != "") {
      this.$vuetify.theme.change(theme);
    }
    this.$appdata.set("is_dark", this.$vuetify.theme.global.current.dark);

    //Carrega o idioma
    let lang = this.$userdata.get("language");
    if (lang != "") {
      this.$i18n.locale = lang;
    } else {
      this.$userdata.set("language", this.$i18n.locale);
    }

    //Checa se está em modo de desenvolvimento
    let is_dev = import.meta.env.VITE_APP_MODE == "development";
    this.$appdata.set("is_dev", is_dev);

    if (!is_dev) {
      //Prevenir REFRESH
      window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
        event.returnValue = "";
      });
    }

    //Checa as plataformas
    this.$appdata.set(
      "is_mobile",
      this.$vuetify.display.platform.android ||
        this.$vuetify.display.platform.ios,
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
                window.location.origin,
              );
            });
            //popup.postMessage({ all: data }, window.location.origin);
          }
        } else if (event.data == "closed") {
          this.$popup.close();
        }
      }
    });

    /*********************************************************************/
    /*********************************************************************/
    /* ********************* PROVISORIO ******************************** */
    if (is_dev) {
      //const self = this;
      setTimeout(function () {
        //self.$media.open({ id_music: 112, mode: "audio", minimized: false });
        //self.$modules.open("clock");
        //self.$modules.open("collections");
        //self.$media.openAlbum(9);
      }, 100);
    }
    /*********************************************************************/
    /*********************************************************************/
  },
};
</script>

<style>
main {
  display: flex !important;
  flex: auto !important;
  align-items: stretch !important;
  --v-layout-top: 0 !important;
  padding-top: 0 !important;
  overflow: auto !important;
}
</style>
