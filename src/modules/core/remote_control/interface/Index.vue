<template>
  <ModuleContainer ref="moduleContainer" :manifest="manifest">
    <v-card flat>
      <v-card-text class="px-0">
        <small>{{ t("info_module") }}</small>
      </v-card-text>
      <v-card-text class="px-0">
        <v-text-field
          v-model="url"
          :disabled="loading || is_connected"
          :label="t('labels.ip')"
          density="compact"
          variant="outlined"
          prepend-icon="mdi-ip-network"
          :hint="t('messages.get_ip')"
          persistent-hint
          :loading="loading ? 'warning' : null"
        />
        <v-text-field
          v-model="token"
          :disabled="loading || is_connected"
          :label="t('labels.token')"
          class="mt-3"
          density="compact"
          variant="outlined"
          prepend-icon="mdi-code-braces"
          persistent-hint
          :loading="loading ? 'warning' : null"
        />
      </v-card-text>
      <v-card-actions class="px-0">
        <v-spacer></v-spacer>
        <v-btn color="info" :text="t('labels.test_connection')" @click="test" />
        <v-btn
          v-if="!is_connected"
          color="success"
          text="Conectar"
          @click="connect"
        />
        <v-btn
          v-else
          color="error"
          :text="t('labels.disconnect')"
          @click="disonnect"
        />
      </v-card-actions>
    </v-card>
  </ModuleContainer>
</template>

<script setup>
/* ########################################################### */
/* ####### INSTALAÇÃO DO MODULO ############################## */
/* ########################################################### */
defineOptions({ name: "RemoteControlIndex" });
import { ref, computed, getCurrentInstance, onMounted } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
const moduleContainer = ref(null);
const t = (key) => {
  return moduleContainer.value?.t(key) || key;
};
/* ########################################################### */
/* ########################################################### */
/* ########################################################### */

const { proxy } = getCurrentInstance();
const url = ref("");
const token = ref("");
const loading = ref(false);

const is_connected = computed(() => {
  return proxy.$userdata.get("remote.is_connected");
});

/* ########################################################### */
/* ###################### METHODS ############################# */
/* ########################################################### */

function getUrl(url) {
  url = url
    .trim()
    .replace(/\s+/g, "") // remove qualquer espaço na string
    .replace(/\\/g, "/") // converte \ para /
    .replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }

  if (url == "http://") {
    url = "";
  }

  return url;
}

async function testUrl(url) {
  if (!url || url == "http://" || url == "https://") {
    return {
      message: "modules.remote_control.messages.url_not_provided",
      error: "",
      status: false,
    };
  }

  try {
    const response = await fetch(url + "/api/ping?token=" + token.value, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      return {
        message: "modules.remote_control.messages.url_not_provided",
        error: response.status,
        status: false,
      };
    }

    const data = await response.json();

    if (data.status != "ok") {
      return {
        message:
          data.code == "INVALID_TOKEN"
            ? "modules.remote_control.messages.invalid_token"
            : "modules.remote_control.messages.error",
        error: data.code,
        status: false,
      };
    }
    console.log(data);

    return {
      message: "modules.remote_control.messages.success",
      data: data,
      status: true,
    };
  } catch (error) {
    return {
      message: "modules.remote_control.messages.failed_to_connect",
      error: error.message,
      status: false,
    };
  }
}

async function test() {
  url.value = getUrl(url.value);

  loading.value = true;
  const ret = await testUrl(url.value);
  loading.value = false;

  if (!ret.status) {
    proxy.$alert.error({
      text: ret.message,
      error: ret.error,
    });
    return false;
  }

  if (!ret.status == "ok" && !ret.app == "LouvorJA") {
    proxy.$alert.error({
      text: ret.invalid_url,
    });
    return false;
  }

  proxy.$alert.info({
    text: "modules.remote_control.messages.success",
  });

  return true;
}

async function connect() {
  proxy.$userdata.set("remote.url", getUrl(url.value));
  proxy.$userdata.set("remote.token", token.value);

  if (!(await test())) {
    return;
  }

  proxy.$userdata.set("remote.is_connected", true);
}

function disonnect() {
  proxy.$userdata.set("remote.is_connected", false);
}

/* ########################################################### */
/* ###################### MOUNTED ############################# */
/* ########################################################### */

onMounted(() => {
  url.value = proxy.$userdata.get("remote.url");
  token.value = proxy.$userdata.get("remote.token");
});
</script>
