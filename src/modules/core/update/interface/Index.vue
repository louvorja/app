<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '340px' }"
    @close="close()"
  >
    <div class="pa-4 d-flex flex-column" style="gap: 16px">
      <!-- ================================================================ -->
      <!-- Seção 1: Atualização do app desktop (só no Electron)             -->
      <!-- ================================================================ -->
      <v-card v-if="isDesktop" variant="outlined" class="pa-3">
        <div class="d-flex align-center mb-3" style="gap: 10px">
          <v-icon icon="mdi-cloud-download" size="32" :color="appUpdateColor" />
          <div style="flex: 1">
            <div class="font-weight-medium">{{ t("app_update.title") }}</div>
            <div class="text-caption text-medium-emphasis">v{{ appState.version }}</div>
          </div>
        </div>

        <v-alert
          v-if="appState.status === 'available'"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ t("app_update.available", { version: appState.newVersion }) }}
        </v-alert>

        <v-alert
          v-else-if="appState.status === 'not-available'"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ t("app_update.up_to_date") }}
        </v-alert>

        <v-alert
          v-else-if="appState.status === 'error'"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ appState.error }}
        </v-alert>

        <v-progress-linear
          v-if="appState.status === 'downloading'"
          :model-value="appState.progress"
          color="primary"
          height="8"
          rounded
          class="mb-3"
        >
          <strong>{{ appState.progress }}%</strong>
        </v-progress-linear>

        <div class="d-flex flex-wrap" style="gap: 8px">
          <v-btn
            v-if="['idle', 'not-available', 'available', 'error'].includes(appState.status)"
            size="small"
            :loading="appState.status === 'checking'"
            prepend-icon="mdi-refresh"
            @click="checkAppUpdate"
          >
            {{ t("app_update.check") }}
          </v-btn>

          <v-btn
            v-if="appState.status === 'available'"
            size="small"
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadAppUpdate"
          >
            {{ t("app_update.download") }}
          </v-btn>

          <v-btn
            v-if="appState.status === 'downloaded'"
            size="small"
            color="success"
            prepend-icon="mdi-restart"
            @click="installAppUpdate"
          >
            {{ t("app_update.install") }}
          </v-btn>
        </div>
      </v-card>

      <!-- ================================================================ -->
      <!-- Seção 2: Atualização do banco de dados (web + desktop)           -->
      <!-- ================================================================ -->
      <div class="d-flex flex-column align-center" style="gap: 16px">
        <!-- Status -->
        <v-icon :icon="statusIcon" :color="statusColor" size="48" />
        <div class="text-body-1 font-weight-medium text-center">{{ statusText }}</div>

        <!-- Versões -->
        <v-table v-if="currentVersion" density="compact" class="w-100">
          <tbody>
            <tr>
              <td class="text-medium-emphasis">{{ t("data.current") }}</td>
              <td class="text-right font-weight-medium">{{ currentVersion }}</td>
            </tr>
            <tr v-if="latestVersion">
              <td class="text-medium-emphasis">{{ t("data.latest") }}</td>
              <td class="text-right font-weight-medium">{{ latestVersion }}</td>
            </tr>
          </tbody>
        </v-table>

        <!-- Botões -->
        <div class="d-flex flex-wrap justify-center" style="gap: 8px">
          <v-btn
            :color="primaryColor"
            prepend-icon="mdi-refresh"
            :loading="checking"
            @click="check"
          >
            {{ t("actions.check") }}
          </v-btn>
          <v-btn
            v-if="hasUpdate"
            color="success"
            prepend-icon="mdi-cloud-download"
            @click="doUpdate"
          >
            {{ t("actions.update") }}
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-broom" @click="clearCache">
            {{ t("actions.clear_cache") }}
          </v-btn>
        </div>

        <v-alert v-if="cacheCleared" type="success" :text="t('data.cleared')" density="compact" />
      </div>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import Platform from "@/helpers/Platform";
import AppData from "@/helpers/AppData";

const moduleContainer = ref(null);
const checking = ref(false);
const status = ref("idle");
const currentVersion = ref(null);
const latestVersion = ref(null);
const cacheCleared = ref(false);
const appState = ref({
  status: "idle",
  version: "?",
  progress: 0,
  newVersion: null,
  releaseNotes: null,
  error: null,
});
let appStateUnsub = null;

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));
const isDesktop = computed(() => Platform.isDesktop);

const hasUpdate = computed(
  () => latestVersion.value && currentVersion.value && latestVersion.value !== currentVersion.value
);

const statusIcon = computed(() => {
  if (checking.value) return "mdi-cloud-sync-outline";
  if (status.value === "ok") return "mdi-check-circle-outline";
  if (status.value === "available") return "mdi-cloud-download-outline";
  if (status.value === "error") return "mdi-alert-circle-outline";
  return "mdi-cloud-outline";
});

const statusColor = computed(() => {
  if (status.value === "ok") return "success";
  if (status.value === "available") return "primary";
  if (status.value === "error") return "error";
  return "grey";
});

const statusText = computed(() => {
  if (checking.value) return t("status.checking");
  if (status.value === "ok") return t("status.up_to_date");
  if (status.value === "available") return t("status.available");
  if (status.value === "error") return t("status.error");
  return "";
});

const appUpdateColor = computed(() => {
  const map = {
    idle: "grey",
    checking: "blue",
    available: "info",
    "not-available": "success",
    downloading: "primary",
    downloaded: "success",
    error: "error",
  };
  return map[appState.value.status] ?? "grey";
});

const t = (key) => moduleContainer.value?.t(key) || key;

onMounted(async () => {
  check();

  if (Platform.isDesktop && Platform.updater) {
    try {
      appState.value = await Platform.updater.status();
      appStateUnsub = Platform.updater.onStateChange((state) => {
        appState.value = state;
      });
    } catch (e) {
      console.warn("[update] Não foi possível inicializar updater:", e);
    }
  }
});

onBeforeUnmount(() => {
  if (appStateUnsub) {
    appStateUnsub();
    appStateUnsub = null;
  }
});

async function check() {
  checking.value = true;
  status.value = "idle";
  try {
    const res = await fetch(`${import.meta.env.VITE_URL_DATABASE}/config`, {
      headers: { "Api-Token": import.meta.env.VITE_API_TOKEN },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    latestVersion.value = data?.version ?? null;
    currentVersion.value = import.meta.env.VITE_APP_VERSION ?? "—";
    status.value = hasUpdate.value ? "available" : "ok";
  } catch {
    status.value = "error";
  } finally {
    checking.value = false;
  }
}

function doUpdate() {
  sessionStorage.clear();
  window.location.reload();
}

function clearCache() {
  sessionStorage.clear();
  cacheCleared.value = true;
  setTimeout(() => {
    cacheCleared.value = false;
  }, 4000);
}

function close() {}

async function checkAppUpdate() {
  const updater = Platform.updater;
  if (!updater) return;
  try {
    await updater.check();
    appState.value = await updater.status();
  } catch (e) {
    console.error("[update] checkAppUpdate:", e);
  }
}

async function downloadAppUpdate() {
  const updater = Platform.updater;
  if (!updater) return;
  await updater.download();
}

async function installAppUpdate() {
  const updater = Platform.updater;
  if (!updater) return;
  await updater.install();
}
</script>
