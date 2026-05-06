<template>
  <div class="opt">
    <section v-if="!isDesktop" class="opt-section">
      <p class="opt-hint">{{ $t("options.transmission.desktop_only") }}</p>
    </section>

    <section v-else class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.transmission.http_server") }}</h3>

      <div class="opt-row opt-row--col">
        <div class="opt-folder-path">
          {{
            httpServer.running
              ? $t("options.transmission.server_running", { port: httpServer.port })
              : $t("options.transmission.server_stopped")
          }}
        </div>
        <div class="opt-folder-actions">
          <button
            type="button"
            class="opt-btn"
            :disabled="httpServerLoading"
            @click="toggleHttpServer"
          >
            <v-icon :icon="httpServer.running ? 'mdi-stop' : 'mdi-play'" size="14" class="mr-1" />
            {{
              httpServer.running
                ? $t("options.transmission.stop_server")
                : $t("options.transmission.start_server")
            }}
          </button>
        </div>
      </div>

      <div v-if="httpServer.running && localIps.length" class="opt-row opt-row--col">
        <label class="opt-label">{{ $t("options.transmission.access_url") }}</label>
        <div v-for="ip in localIps" :key="ip" class="opt-folder-path opt-folder-path--row">
          <span style="word-break: break-all">
            http://{{ ip }}:{{ httpServer.port }}/?token={{ httpServer.token }}
          </span>
          <button type="button" class="opt-btn opt-btn--small" @click="copyServerUrl(ip)">
            {{
              copiedIp === ip ? $t("options.transmission.copied") : $t("options.transmission.copy")
            }}
          </button>
        </div>
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="httpServerAutoStart"
            @change="setHttpServerAutoStart($event.target.checked)"
          />
          <span>{{ $t("options.transmission.auto_start") }}</span>
        </label>
      </div>
    </section>

    <section v-if="isDesktop" class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.transmission.shortcuts_title") }}</h3>
      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="globalShortcutsEnabled"
            @change="toggleGlobalShortcuts($event.target.checked)"
          />
          <span>{{ $t("options.transmission.global_shortcuts") }}</span>
        </label>
      </div>
      <p class="opt-hint">{{ $t("options.transmission.global_shortcuts_hint") }}</p>
    </section>

    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.transmission.windows") }}</h3>
      <div class="opt-windows">
        <div v-for="win in windows" :key="win.route" class="opt-window">
          <v-icon :icon="win.icon" size="20" />
          <div class="opt-window-info">
            <div class="opt-window-title">{{ $t(win.titleKey) }}</div>
            <div class="opt-window-hint">{{ $t(win.hintKey) }}</div>
          </div>
          <select
            v-if="displays.length"
            class="opt-select opt-select--inline"
            :value="getPref(featureKey(win.route)) ?? ''"
            @change="setPref(featureKey(win.route), $event.target.value)"
          >
            <option value="">{{ $t("options.slides.same_window") }}</option>
            <option v-for="d in displays" :key="d.id" :value="d.id">
              {{ d.label || `Monitor ${d.id}` }}
            </option>
          </select>
          <button type="button" class="opt-btn opt-btn--small" @click="openWindow(win)">
            {{ $t("options.transmission.open") }}
          </button>
          <button type="button" class="opt-btn opt-btn--small" @click="copyTransmissionUrl(win)">
            {{
              copiedRoute === win.route
                ? $t("options.transmission.copied")
                : $t("options.transmission.copy")
            }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useDisplays } from "@/composables/useDisplays";
import Platform from "@/helpers/Platform";

const isDesktop = computed(() => Platform.isDesktop);
const { displays, getPreferred, setPreferred } = useDisplays();

const FULLSCREEN_ROUTES = ["/projection", "/projection/return", "/obs", "/obs/bible", "/clock"];
const FRAMED_ROUTES = ["/operator"];

const windows = [
  {
    route: "/projection",
    icon: "mdi-monitor",
    titleKey: "options.transmission.win_projection",
    hintKey: "options.transmission.win_projection_hint",
  },
  {
    route: "/projection/return",
    icon: "mdi-monitor-eye",
    titleKey: "options.transmission.win_return",
    hintKey: "options.transmission.win_return_hint",
  },
  {
    route: "/operator",
    icon: "mdi-view-grid-outline",
    titleKey: "options.transmission.win_operator",
    hintKey: "options.transmission.win_operator_hint",
  },
  {
    route: "/obs",
    icon: "mdi-television-play",
    titleKey: "options.transmission.win_obs",
    hintKey: "options.transmission.win_obs_hint",
  },
  {
    route: "/obs/bible",
    icon: "mdi-book-open-variant",
    titleKey: "options.transmission.win_obs_bible",
    hintKey: "options.transmission.win_obs_bible_hint",
  },
  {
    route: "/clock",
    icon: "mdi-clock-outline",
    titleKey: "options.transmission.win_clock",
    hintKey: "options.transmission.win_clock_hint",
  },
];

const httpServer = ref({ running: false, port: null, token: null });
const httpServerLoading = ref(false);
const httpServerAutoStart = ref(false);
const localIps = ref([]);
const copiedIp = ref(null);
const copiedRoute = ref(null);
const globalShortcutsEnabled = ref(false);

function featureKey(route) {
  return `transmission:${route}`;
}
function getPref(feature) {
  return getPreferred(feature);
}
function setPref(feature, displayId) {
  const id = displayId === "" ? null : Number(displayId);
  setPreferred(feature, id);
}

async function toggleHttpServer() {
  if (!Platform.httpServer) return;
  httpServerLoading.value = true;
  try {
    if (httpServer.value.running) await Platform.httpServer.stop();
    else await Platform.httpServer.start({ port: 7070 });
    httpServer.value = await Platform.httpServer.status();
    if (httpServer.value.running && !localIps.value.length) {
      localIps.value = await Platform.httpServer.localIps();
    }
  } catch (e) {
    console.error("[Transmitir] toggle:", e);
  } finally {
    httpServerLoading.value = false;
  }
}

async function setHttpServerAutoStart(enabled) {
  httpServerAutoStart.value = enabled;
  if (!Platform.userStore) return;
  try {
    const cfg = (await Platform.userStore.read("config")) || {};
    if (!cfg.httpServer) cfg.httpServer = {};
    cfg.httpServer.autoStart = enabled;
    cfg.httpServer.port = 7070;
    await Platform.userStore.write("config", cfg);
  } catch (e) {
    console.warn("[Transmitir] autoStart:", e);
  }
}

async function copyServerUrl(ip) {
  const url = `http://${ip}:${httpServer.value.port}/?token=${httpServer.value.token}`;
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

async function copyTransmissionUrl(win) {
  try {
    await navigator.clipboard.writeText(window.location.origin + win.route);
    copiedRoute.value = win.route;
    setTimeout(() => {
      copiedRoute.value = null;
    }, 2000);
  } catch {
    /* noop */
  }
}

async function openWindow(win) {
  const { route } = win;
  if (Platform.windows) {
    const feature = featureKey(route);
    const fullscreen = FULLSCREEN_ROUTES.some((r) => route.startsWith(r));
    const frame = FRAMED_ROUTES.some((r) => route.startsWith(r));
    const monitorId = getPref(feature) ?? null;
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
      console.error("[Transmitir] open:", e);
    }
  }
  window.open(window.location.origin + route, "_blank", "noopener,noreferrer");
}

async function toggleGlobalShortcuts(enabled) {
  globalShortcutsEnabled.value = enabled;
  if (!Platform.shortcuts) return;
  try {
    if (enabled) await Platform.shortcuts.enable();
    else await Platform.shortcuts.disable();
    await Platform.shortcuts.savePreference(enabled);
  } catch (e) {
    console.error("[Transmitir] shortcuts:", e);
  }
}

onMounted(async () => {
  if (!isDesktop.value) return;
  if (Platform.httpServer) {
    try {
      httpServer.value = await Platform.httpServer.status();
      localIps.value = await Platform.httpServer.localIps();
      const cfg = (await Platform.userStore?.read("config")) || {};
      httpServerAutoStart.value = cfg.httpServer?.autoStart ?? false;
    } catch (e) {
      console.warn("[Transmitir] init:", e);
    }
  }
  if (Platform.shortcuts) {
    try {
      const s = await Platform.shortcuts.status();
      globalShortcutsEnabled.value = s.enabled;
    } catch (e) {
      console.warn("[Transmitir] shortcuts init:", e);
    }
  }
});
</script>
