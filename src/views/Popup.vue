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

function loadModuleComponent() {
  return defineAsyncComponent(() => {
    return import(`@/modules/core/${module.value}/interface/Popup.vue`).catch(() => {
      return import(`@/modules/${module.value}/interface/Popup.vue`).catch((e) => {
        Alert.error({
          text: "messages.error_import_module",
          error: e,
        });
        return null;
      });
    });
  });
}

onMounted(() => {
  AppData.set("is_popup", true);
  window.addEventListener("message", (event) => {
    if (event.origin === window.location.origin) {
      message.value = event.data;
      if (event.data.param) {
        AppData.set(event.data.param, event.data.value);
      }
    }
  });

  window.opener.postMessage("mounted", window.location.origin);

  window.addEventListener("beforeunload", () => {
    window.opener?.postMessage("closed", window.location.origin);
  });
});
</script>
