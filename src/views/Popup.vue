<template>
  <div class="w-100 h-100" style="background: #000">
    <component :is="loadModuleComponent()" v-if="module" />
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import AppData from "@/helpers/AppData";
import Alert from "@/helpers/Alert";

export default {
  name: "PopupPage",
  data: () => ({
    message: null,
  }),
  computed: {
    module() {
      return AppData.get("popup_module");
    },
  },
  mounted() {
    AppData.set("is_popup", true);
    window.addEventListener("message", (event) => {
      if (event.origin === window.location.origin) {
        this.message = event.data;
        if (event.data.param) {
          AppData.set(event.data.param, event.data.value);
        }
      }
    });

    window.opener.postMessage("mounted", window.location.origin);

    window.addEventListener("beforeunload", () => {
      window.opener?.postMessage("closed", window.location.origin);
    });
  },
  methods: {
    loadModuleComponent() {
      return defineAsyncComponent(() => {
        // Try to load from modules interface directory
        return import(`@/modules/core/${this.module}/interface/Popup.vue`).catch(() => {
          // Try to load from CUSTOM module interface directory
          return import(`@/modules/${this.module}/interface/Popup.vue`).catch((e) => {
            Alert.error({
              text: "messages.error_import_module",
              error: e,
            });

            return null;
          });
        });
      });
    },
  },
};
</script>
