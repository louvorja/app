<template>
  <div class="w-100 h-100" style="background: #000">
    <component :is="loadModuleComponent()" v-if="module" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from "vue";
import AppData from "@/helpers/AppData";
import Alert from "@/helpers/Alert";

const message = ref(null);
const module = computed(() => AppData.get("popup_module"));

// Inicializa popup_module a partir da query string (?module=X). Necessário porque
// cada janela Electron tem seu próprio Pinia store e $appdata não é compartilhado
// entre opener e popup. postMessage continua suportado para troca dinâmica.
function readModuleFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("module");
  } catch (_) {
    return null;
  }
}

function loadModuleComponent() {
  return defineAsyncComponent(() => {
    return import(`@/modules/${module.value}/components/Popup.vue`).catch((e) => {
      Alert.error({
        text: "messages.error_import_module",
        error: e,
      });
      return null;
    });
  });
}

onMounted(() => {
  AppData.set("is_popup", true);

  const initialModule = readModuleFromUrl();
  if (initialModule) AppData.set("popup_module", initialModule);

  window.addEventListener("message", (event) => {
    if (event.origin === window.location.origin) {
      message.value = event.data;
      if (event.data?.param) {
        AppData.set(event.data.param, event.data.value);
      }
    }
  });

  window.opener?.postMessage("mounted", window.location.origin);

  window.addEventListener("beforeunload", () => {
    window.opener?.postMessage("closed", window.location.origin);
  });
});
</script>
