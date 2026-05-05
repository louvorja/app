<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '400px' }"
    @close="close()"
  >
    <div class="pa-3 d-flex flex-column" style="gap: 12px">
      <!-- Botão "Identificar Monitores" — só no desktop, topo da lista -->
      <div v-if="isDesktop" class="d-flex align-center justify-space-between">
        <span class="text-caption text-medium-emphasis">
          {{ monitors.length > 0 ? `${monitors.length} monitor(es)` : t("data.loading_monitors") }}
        </span>
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-monitor-multiple"
          :title="t('actions.identify_monitors')"
          @click="identifyMonitors"
        >
          {{ t("actions.identify_monitors") }}
        </v-btn>
      </div>

      <!-- Card do servidor HTTP — apenas no desktop -->
      <v-card v-if="isDesktop" variant="outlined" class="pa-3">
        <div class="d-flex align-center mb-2" style="gap: 10px">
          <v-icon icon="mdi-server-network" size="26" />
          <div style="flex: 1; min-width: 0">
            <div class="font-weight-medium text-body-2">{{ t("data.server_status") }}</div>
            <div
              class="text-caption"
              :class="server.running ? 'text-success' : 'text-medium-emphasis'"
            >
              {{
                server.running
                  ? t("data.server_running", { port: server.port })
                  : t("data.server_stopped")
              }}
            </div>
          </div>
          <v-btn
            size="small"
            :color="server.running ? 'error' : 'primary'"
            :loading="serverLoading"
            :prepend-icon="server.running ? 'mdi-stop' : 'mdi-play'"
            @click="toggleServer"
          >
            {{ server.running ? t("actions.stop_server") : t("actions.start_server") }}
          </v-btn>
        </div>

        <!-- Token e URL — visíveis só quando rodando -->
        <template v-if="server.running">
          <div class="d-flex align-center mt-1" style="gap: 8px">
            <span class="text-caption text-medium-emphasis">{{ t("data.token_label") }}:</span>
            <code class="text-caption font-weight-bold" style="letter-spacing: 0.1em">
              {{ server.token }}
            </code>
          </div>

          <div
            v-for="ip in localIps"
            :key="ip"
            class="d-flex align-center mt-1"
            style="gap: 8px; flex-wrap: wrap"
          >
            <span class="text-caption text-disabled" style="word-break: break-all">
              http://{{ ip }}:{{ server.port }}/?token={{ server.token }}
            </span>
            <v-btn
              size="x-small"
              variant="text"
              :icon="copiedIp === ip ? 'mdi-check' : 'mdi-content-copy'"
              :color="copiedIp === ip ? 'success' : undefined"
              @click="copyServerUrl(ip)"
            />
          </div>
        </template>

        <!-- Auto-start toggle -->
        <v-switch
          v-model="autoStart"
          :label="t('data.auto_start')"
          density="compact"
          hide-details
          class="mt-2"
          @update:model-value="saveAutoStart"
        />
      </v-card>

      <!-- Aviso PWA -->
      <v-alert
        v-else-if="!isDesktop"
        type="info"
        variant="tonal"
        density="compact"
        class="text-caption"
      >
        {{ t("data.server_desktop_only") }}
      </v-alert>

      <!-- Card de atalhos globais — só desktop -->
      <v-card v-if="isDesktop" variant="outlined" class="pa-3">
        <div class="d-flex align-center mb-2" style="gap: 10px">
          <v-icon icon="mdi-keyboard" size="26" />
          <div style="flex: 1">
            <div class="font-weight-medium text-body-2">{{ t("data.global_shortcuts") }}</div>
            <div
              class="text-caption"
              :class="shortcutsStatus.enabled ? 'text-success' : 'text-medium-emphasis'"
            >
              {{
                shortcutsStatus.enabled ? t("data.shortcuts_active") : t("data.shortcuts_inactive")
              }}
            </div>
          </div>
          <v-switch
            v-model="shortcutsEnabled"
            density="compact"
            hide-details
            color="primary"
            @update:model-value="toggleShortcuts"
          />
        </div>

        <div
          v-if="shortcutsStatus.enabled && shortcutsStatus.registered.length > 0"
          class="text-caption text-medium-emphasis mt-2"
          style="display: flex; flex-wrap: wrap; gap: 4px"
        >
          <code v-for="acc in shortcutsStatus.registered" :key="acc">{{ acc }}</code>
        </div>

        <v-alert
          v-if="shortcutsFailed.length > 0"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-2 text-caption"
        >
          {{ t("data.shortcuts_failed", { list: shortcutsFailed.join(", ") }) }}
        </v-alert>
      </v-card>

      <TransmissionCard
        v-for="win in windows"
        :key="win.route"
        :icon="win.icon"
        :title="t(win.titleKey)"
        :hint="t(win.hintKey)"
        :url="origin + win.route"
        :btn-open="t('actions.open')"
        :btn-copy="t('actions.copy')"
        :btn-copied="t('actions.copied')"
        :monitors="monitors"
        :selected-monitor="monitorPrefs[featureKey(win.route)]"
        :is-desktop="isDesktop"
        @open="openWindow(win)"
        @set-monitor="(displayId) => setMonitor(featureKey(win.route), displayId)"
      />
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import TransmissionCard from "./TransmissionCard.vue";
import Platform from "@/helpers/Platform";

const FULLSCREEN_ROUTES = ["/projection", "/projection/return", "/obs", "/obs/bible", "/clock"];
const FRAMED_ROUTES = ["/operator"];

const moduleContainer = ref(null);
const windows = [
  {
    route: "/projection",
    icon: "mdi-monitor",
    titleKey: "windows.projection",
    hintKey: "hints.projection",
  },
  {
    route: "/projection/return",
    icon: "mdi-monitor-eye",
    titleKey: "windows.return",
    hintKey: "hints.return",
  },
  {
    route: "/operator",
    icon: "mdi-view-grid-outline",
    titleKey: "windows.operator",
    hintKey: "hints.operator",
  },
  { route: "/obs", icon: "mdi-television-play", titleKey: "windows.obs", hintKey: "hints.obs" },
  {
    route: "/obs/bible",
    icon: "mdi-book-open-variant",
    titleKey: "windows.obs_bible",
    hintKey: "hints.obs_bible",
  },
  {
    route: "/clock",
    icon: "mdi-clock-outline",
    titleKey: "windows.clock",
    hintKey: "hints.clock",
  },
];

const monitors = ref([]);
const monitorPrefs = ref({});
const server = ref({ running: false, port: null, token: null });
const serverLoading = ref(false);
const localIps = ref([]);
const autoStart = ref(false);
const copiedIp = ref(null);
const shortcutsStatus = ref({ enabled: false, registered: [] });
const shortcutsEnabled = ref(false);
const shortcutsFailed = ref([]);

const origin = computed(() => window.location.origin);
const isDesktop = computed(() => Platform?.isDesktop || false);

const t = (key, args) => moduleContainer.value?.t(key, args) || key;

onMounted(async () => {
  if (!isDesktop.value) return;

  if (Platform.displays) {
    try {
      monitors.value = await Platform.displays.list();
      monitorPrefs.value = await Platform.displays.getPrefs();
    } catch (e) {
      console.warn("[Transmission] Falha ao carregar monitores:", e);
    }
  }

  if (Platform.httpServer) {
    try {
      server.value = await Platform.httpServer.status();
      localIps.value = await Platform.httpServer.localIps();
    } catch (e) {
      console.warn("[Transmission] Falha ao carregar status do servidor:", e);
    }

    try {
      const cfg = (await Platform.userStore?.read("config")) || {};
      autoStart.value = cfg.httpServer?.autoStart ?? false;
    } catch (e) {
      console.warn("[Transmission] Falha ao carregar configuração:", e);
    }
  }

  if (Platform.shortcuts) {
    try {
      shortcutsStatus.value = await Platform.shortcuts.status();
      shortcutsEnabled.value = shortcutsStatus.value.enabled;
    } catch (e) {
      console.warn("[Transmission] Falha ao carregar status dos atalhos:", e);
    }
  }
});

function featureKey(route) {
  return `transmission:${route}`;
}

async function toggleServer() {
  if (!Platform.httpServer) return;
  serverLoading.value = true;
  try {
    if (server.value.running) {
      await Platform.httpServer.stop();
    } else {
      await Platform.httpServer.start({ port: 7070 });
    }
    server.value = await Platform.httpServer.status();
    if (server.value.running && localIps.value.length === 0) {
      localIps.value = await Platform.httpServer.localIps();
    }
  } catch (e) {
    console.error("[Transmission] Falha ao alternar servidor:", e);
  } finally {
    serverLoading.value = false;
  }
}

async function saveAutoStart(value) {
  if (!Platform.userStore) return;
  try {
    const cfg = (await Platform.userStore.read("config")) || {};
    if (!cfg.httpServer) cfg.httpServer = {};
    cfg.httpServer.autoStart = value;
    cfg.httpServer.port = 7070;
    await Platform.userStore.write("config", cfg);
  } catch (e) {
    console.warn("[Transmission] Falha ao salvar auto-start:", e);
  }
}

async function copyServerUrl(ip) {
  const url = `http://${ip}:${server.value.port}/?token=${server.value.token}`;
  try {
    await navigator.clipboard.writeText(url);
    copiedIp.value = ip;
    setTimeout(() => {
      copiedIp.value = null;
    }, 2000);
  } catch {
    /* noop */
  }
}

async function openWindow(win) {
  const { route } = win;

  if (isDesktop.value && Platform.windows) {
    const feature = featureKey(route);
    const fullscreen = FULLSCREEN_ROUTES.some((r) => route.startsWith(r));
    const frame = FRAMED_ROUTES.some((r) => route.startsWith(r));
    const monitorId = monitorPrefs.value[feature] ?? null;

    try {
      await Platform.windows.open({
        route,
        feature,
        fullscreen,
        frame,
        ...(monitorId !== null ? { monitorId } : {}),
      });
      return;
    } catch (e) {
      console.error("[Transmission] Falha ao abrir janela via Electron:", e);
    }
  }

  window.open(window.location.origin + route, "_blank", "noopener,noreferrer");
}

async function identifyMonitors() {
  if (Platform?.displays) {
    try {
      const count = await Platform.displays.identify(5000);
      console.log(`[Transmission] Identificando ${count} monitor(es)...`);
    } catch (e) {
      console.warn("[Transmission] Falha ao identificar monitores:", e);
    }
  }
}

async function setMonitor(featureId, displayId) {
  if (Platform?.displays) {
    try {
      await Platform.displays.setPreferred(featureId, displayId);
      monitorPrefs.value = { ...monitorPrefs.value, [featureId]: displayId };
    } catch (e) {
      console.warn("[Transmission] Falha ao salvar preferência de monitor:", e);
    }
  }
}

async function toggleShortcuts(value) {
  if (!Platform.shortcuts) return;
  try {
    if (value) {
      const result = await Platform.shortcuts.enable();
      shortcutsStatus.value = await Platform.shortcuts.status();
      shortcutsFailed.value = result.failed || [];
    } else {
      await Platform.shortcuts.disable();
      shortcutsStatus.value = { enabled: false, registered: [] };
      shortcutsFailed.value = [];
    }
    await Platform.shortcuts.savePreference(value);
  } catch (e) {
    console.error("[Transmission] Falha ao alternar atalhos globais:", e);
  }
}

function close() {}
</script>
