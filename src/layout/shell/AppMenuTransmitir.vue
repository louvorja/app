<template>
  <div class="opt">
    <section v-if="!isDesktop" class="opt-section">
      <p class="opt-hint">{{ $t("options.transmission.desktop_only") }}</p>
    </section>

    <template v-else>
      <!-- Servidor: status + start/stop + token + auto-start -->
      <section class="opt-section">
        <h3 class="opt-section-title">{{ $t("options.transmission.http_server") }}</h3>

        <div class="tx-status">
          <span class="tx-dot" :class="{ 'tx-dot--on': httpServer.running }" />
          <span v-if="httpServer.running" class="tx-status-url">
            {{ baseUrl }}
          </span>
          <span v-else class="tx-status-text">
            {{ $t("options.transmission.server_stopped") }}
          </span>
          <button
            type="button"
            class="opt-btn opt-btn--small"
            :disabled="httpServerLoading"
            @click="toggleHttpServer"
          >
            {{
              httpServer.running
                ? $t("options.transmission.stop_server")
                : $t("options.transmission.start_server")
            }}
          </button>
        </div>

        <div v-if="httpServer.running" class="tx-token-row">
          <span class="tx-token-label">{{ $t("options.transmission.token_label") }}</span>
          <code class="tx-token">{{ httpServer.token }}</code>
          <button type="button" class="opt-btn opt-btn--small" @click="resetToken">
            {{ $t("options.transmission.token_reset") }}
          </button>
        </div>

        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="httpServerAutoStart"
            @change="setHttpServerAutoStart($event.target.checked)"
          />
          <span>{{ $t("options.transmission.auto_start") }}</span>
        </label>
      </section>

      <!-- URLs de transmissão (compatibilidade Delphi) -->
      <section v-if="httpServer.running" class="opt-section">
        <h3 class="opt-section-title">{{ $t("options.transmission.urls_section") }}</h3>
        <p class="opt-hint">{{ $t("options.transmission.urls_hint") }}</p>

        <div class="tx-urls">
          <div v-for="link in remoteLinks" :key="link.alias" class="tx-url-row">
            <div class="tx-url-info">
              <div class="tx-url-title">{{ $t(link.titleKey) }}</div>
              <code class="tx-url">{{ remoteUrl(link) }}</code>
            </div>
            <button
              type="button"
              class="opt-btn opt-btn--small"
              @click="copy(remoteUrl(link), link.alias)"
            >
              {{
                copiedKey === link.alias
                  ? $t("options.transmission.copied")
                  : $t("options.transmission.copy")
              }}
            </button>
          </div>
        </div>
      </section>

      <!-- Atalhos globais -->
      <section class="opt-section">
        <h3 class="opt-section-title">{{ $t("options.transmission.shortcuts_title") }}</h3>
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="globalShortcutsEnabled"
            @change="toggleGlobalShortcuts($event.target.checked)"
          />
          <span>{{ $t("options.transmission.global_shortcuts") }}</span>
        </label>
        <p class="opt-hint">{{ $t("options.transmission.global_shortcuts_hint") }}</p>
      </section>
    </template>

    <!-- Janelas locais — abre uma view como BrowserWindow -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.transmission.local_windows") }}</h3>
      <p class="opt-hint">{{ $t("options.transmission.local_windows_hint") }}</p>
      <div class="tx-local">
        <div v-for="win in localWindows" :key="win.route" class="tx-local-row">
          <v-icon :icon="win.icon" size="18" />
          <div class="tx-local-info">
            <div class="tx-local-title">{{ $t(win.titleKey) }}</div>
          </div>
          <select
            v-if="displays.length"
            class="opt-select opt-select--inline tx-local-select"
            :value="getPref(featureKey(win.route)) ?? ''"
            @change="setPref(featureKey(win.route), $event.target.value)"
          >
            <option value="">{{ $t("options.slides.same_window") }}</option>
            <option v-for="d in displays" :key="d.id" :value="d.id">
              {{ d.label || `Monitor ${d.id}` }}
            </option>
          </select>
          <button type="button" class="opt-btn opt-btn--small" @click="openLocalWindow(win)">
            {{ $t("options.transmission.open_window") }}
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

// Aliases compat-Delphi: mantemos exatamente os mesmos paths que o
// `fmTransmitir.pas` divulgava — assim tutoriais antigos continuam válidos
// e os usuários reconhecem os termos "Transmissão" e "Retorno".
const remoteLinks = [
  { alias: "/musica?transmissao", titleKey: "options.transmission.win_music" },
  { alias: "/musica?retorno", titleKey: "options.transmission.win_return" },
  { alias: "/biblia?transmissao", titleKey: "options.transmission.win_bible" },
];

const localWindows = [
  {
    route: "/projection",
    icon: "mdi-monitor",
    titleKey: "options.transmission.win_projection",
  },
  {
    route: "/projection/return",
    icon: "mdi-monitor-eye",
    titleKey: "options.transmission.win_return",
  },
  {
    route: "/operator",
    icon: "mdi-view-grid-outline",
    titleKey: "options.transmission.win_operator",
  },
  {
    route: "/obs",
    icon: "mdi-television-play",
    titleKey: "options.transmission.win_music",
  },
  {
    route: "/obs/bible",
    icon: "mdi-book-open-variant",
    titleKey: "options.transmission.win_bible",
  },
  {
    route: "/clock",
    icon: "mdi-clock-outline",
    titleKey: "options.transmission.win_clock",
  },
];

const httpServer = ref({ running: false, port: null, token: null });
const httpServerLoading = ref(false);
const httpServerAutoStart = ref(false);
const localIps = ref([]);
const copiedKey = ref(null);
const globalShortcutsEnabled = ref(false);

// IP "público" preferido — primeiro não-loopback. Cai pra 127.0.0.1
// quando a máquina não tem interface de rede ativa (raro: notebook offline).
const primaryHost = computed(() => {
  return localIps.value.find((ip) => ip !== "127.0.0.1") || "127.0.0.1";
});

const baseUrl = computed(() => {
  if (!httpServer.value.running) return "";
  return `http://${primaryHost.value}:${httpServer.value.port}`;
});

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

function remoteUrl(link) {
  if (!httpServer.value.running) return "";
  const url = `${baseUrl.value}${link.alias}`;
  if (!httpServer.value.token) return url;
  // Aliases Delphi sempre têm `?` (`?transmissao`, `?retorno`).
  const sep = link.alias.includes("?") ? "&" : "?";
  return `${url}${sep}token=${httpServer.value.token}`;
}

async function copy(text, key) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = key;
    setTimeout(() => {
      copiedKey.value = null;
    }, 2000);
  } catch {
    /* clipboard pode estar bloqueado — ignora silenciosamente */
  }
}

async function toggleHttpServer() {
  if (!Platform.httpServer) return;
  httpServerLoading.value = true;
  try {
    if (httpServer.value.running) await Platform.httpServer.stop();
    else await Platform.httpServer.start({});
    await refreshStatus();
  } catch (e) {
    console.error("[Transmitir] toggle:", e);
  } finally {
    httpServerLoading.value = false;
  }
}

async function resetToken() {
  if (!Platform.httpServer?.resetToken) return;
  try {
    await Platform.httpServer.resetToken();
    await refreshStatus();
  } catch (e) {
    console.error("[Transmitir] resetToken:", e);
  }
}

async function refreshStatus() {
  if (!Platform.httpServer) return;
  httpServer.value = await Platform.httpServer.status();
  if (!localIps.value.length) {
    try {
      localIps.value = await Platform.httpServer.localIps();
    } catch {
      /* noop */
    }
  }
}

async function setHttpServerAutoStart(enabled) {
  httpServerAutoStart.value = enabled;
  if (!Platform.userStore) return;
  try {
    const cfg = (await Platform.userStore.read("config")) || {};
    if (!cfg.httpServer) cfg.httpServer = {};
    cfg.httpServer.autoStart = enabled;
    if (!cfg.httpServer.port) cfg.httpServer.port = 7070;
    await Platform.userStore.write("config", cfg);
  } catch (e) {
    console.warn("[Transmitir] autoStart:", e);
  }
}

async function openLocalWindow(win) {
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
      await refreshStatus();
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

<style scoped>
/* Status do servidor: bullet + url/legenda + botão alinhados em uma linha. */
.tx-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.tx-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #aaa;
  flex-shrink: 0;
}
.tx-dot--on {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.18);
}
.tx-status-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  flex: 1;
  word-break: break-all;
}
.tx-status-text {
  flex: 1;
  opacity: 0.7;
}

.tx-token-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}
.tx-token-label {
  opacity: 0.7;
  font-size: 0.85rem;
}
.tx-token {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  background: rgba(127, 127, 127, 0.12);
  border-radius: 4px;
}

/* Lista de URLs de transmissão. */
.tx-urls {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tx-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(127, 127, 127, 0.06);
  border-radius: 6px;
}
.tx-url-info {
  flex: 1;
  min-width: 0;
}
.tx-url-title {
  font-weight: 500;
  margin-bottom: 2px;
}
.tx-url {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  opacity: 0.85;
  word-break: break-all;
  display: block;
}

/* Janelas locais — linha mais compacta. */
.tx-local {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tx-local-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.tx-local-info {
  flex: 1;
}
.tx-local-title {
  font-size: 0.92rem;
}
.tx-local-select {
  max-width: 180px;
}
</style>
