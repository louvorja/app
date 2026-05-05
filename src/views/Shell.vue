<template>
  <v-app :class="{ 'shell-fading-in': !ready }">
    <AppSystemBar />

    <RibbonBar />

    <!-- PageControl interno (tabs dos módulos abertos) -->
    <OpenModulesTabs />

    <v-main class="shell-main">
      <div class="shell-grid">
        <div class="shell-center">
          <div class="shell-content">
            <AppLoading />
            <AppAlert />
            <AppModules />
          </div>
        </div>

        <!-- Sidebar Liturgia: oculta quando o módulo Liturgia já está aberto
             (evita duplicar conteúdo) -->
        <ShellLiturgyPanel v-if="!liturgyModuleOpen" class="shell-sidebar" />
      </div>
    </v-main>

    <ShellStatusBar />
    <AppFooter />

    <CommandPalette v-model="cmdPaletteOpen" />
    <HotkeysCheatsheet v-model="hotkeysOpen" />
    <FormatacaoDialog />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme, useDisplay } from "vuetify";

import AppSystemBar from "@/layout/SystemBar.vue";
import AppFooter from "@/layout/Footer.vue";
import AppModules from "@/layout/Modules.vue";
import AppAlert from "@/layout/Alert.vue";
import AppLoading from "@/layout/Loading.vue";
import CommandPalette from "@/layout/shell/CommandPalette.vue";
import RibbonBar from "@/layout/shell/RibbonBar.vue";
import OpenModulesTabs from "@/layout/shell/OpenModulesTabs.vue";
import ShellStatusBar from "@/layout/shell/StatusBar.vue";
import ShellLiturgyPanel from "@/layout/shell/ShellLiturgyPanel.vue";
import HotkeysCheatsheet from "@/layout/shell/HotkeysCheatsheet.vue";
import FormatacaoDialog from "@/layout/shell/FormatacaoDialog.vue";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
import $popup from "@/helpers/Popup";

import { registerShell } from "@/composables/useShell";

const { locale } = useI18n();
const vuetifyTheme = useTheme();
const display = useDisplay();

const cmdPaletteOpen = ref(false);
const hotkeysOpen = ref(false);
const ready = ref(false);

const liturgyModuleOpen = computed(() => {
  return $appdata.get("modules.liturgy.show", false) === true;
});

// Listeners externos (eventos globais que substituem acoplamento direto via shell._ref)
const onOpenCommandPalette = () => {
  cmdPaletteOpen.value = true;
};
const onOpenHotkeys = () => {
  hotkeysOpen.value = true;
};

let beforeUnloadHandler = null;
let messageHandler = null;

// Métodos expostos via shell._ref para outros componentes
function openCommandPalette() {
  cmdPaletteOpen.value = true;
}
function openHotkeysCheatsheet() {
  hotkeysOpen.value = true;
}

defineExpose({ openCommandPalette, openHotkeysCheatsheet });

// Registra ações do shell no composable (substitui `$appdata.set("shell._ref")`)
registerShell({ openCommandPalette, openHotkeysCheatsheet });

onMounted(() => {
  // Re-registra no mount (importante após HMR)
  registerShell({ openCommandPalette, openHotkeysCheatsheet });

  window.addEventListener("louvorja:open-command-palette", onOpenCommandPalette);
  window.addEventListener("louvorja:open-hotkeys", onOpenHotkeys);

  $userdata.load();

  // Tema
  const savedTheme = $userdata.get("theme");
  if (savedTheme && savedTheme !== "") {
    try {
      vuetifyTheme.global.name.value = savedTheme;
    } catch {
      /* ignore */
    }
  }
  try {
    $appdata.set("is_dark", !!vuetifyTheme.global.current.value?.dark);
  } catch {
    $appdata.set("is_dark", false);
  }

  // Idioma
  const lang = $userdata.get("language");
  if (lang && lang !== "") {
    locale.value = lang;
  } else {
    $userdata.set("language", locale.value);
  }

  // Plataforma
  const isDev = import.meta.env.VITE_APP_MODE === "development";
  $appdata.set("is_dev", isDev);

  if (!isDev) {
    beforeUnloadHandler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
  }

  $appdata.set("is_mobile", display.platform.value.android || display.platform.value.ios);
  if (display.platform.value.electron) {
    $appdata.set("is_desktop", true);
  } else {
    $appdata.set("is_desktop", false);
    $appdata.set("is_online", true);
  }

  // Bridge popup → main (replica popup ↔ shell)
  messageHandler = (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data === "mounted") {
      const popup = $appdata.get("popup");
      if (popup) {
        const data = $appdata.getFlatten();
        Object.keys(data).forEach((key) => {
          try {
            popup.postMessage({ param: key, value: data[key] }, window.location.origin);
          } catch {
            /* ignore */
          }
        });
      }
    } else if (event.data === "closed") {
      $popup.close();
    }
  };
  window.addEventListener("message", messageHandler);

  // Fade-in 256ms (replica AlphaBlend Delphi)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready.value = true;
    });
  });
});

onBeforeUnmount(() => {
  if (beforeUnloadHandler) window.removeEventListener("beforeunload", beforeUnloadHandler);
  if (messageHandler) window.removeEventListener("message", messageHandler);

  window.removeEventListener("louvorja:open-command-palette", onOpenCommandPalette);
  window.removeEventListener("louvorja:open-hotkeys", onOpenHotkeys);
});
</script>

<style>
.shell-main.shell-main > .v-main__wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Fade-in (AlphaBlend Delphi-style) */
.v-application.shell-fading-in {
  opacity: 0;
}
.v-application {
  transition: opacity 256ms ease-out;
}
</style>

<style scoped>
.shell-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.shell-grid {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.shell-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.shell-content {
  flex: 1;
  overflow: auto;
  position: relative;
  /* Fundo Delphi-style: navy com leve brilho azul no topo + vinheta
     escura nos cantos. Dá profundidade sem "embaçar" o centro. */
  background:
    radial-gradient(ellipse at 50% 0%, rgba(80, 120, 200, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%),
    linear-gradient(180deg, #1b2a41 0%, #0e1a2f 100%);
  color: rgba(255, 255, 255, 0.7);
}

.shell-content::before {
  /* Logo em cor cheia, totalmente nítido. */
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("/ico/favicon-180x180.png");
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 260px 260px;
  pointer-events: none;
}
.shell-sidebar {
  flex-shrink: 0;
}
</style>
