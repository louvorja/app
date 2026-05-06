<template>
  <div class="opt">
    <section v-if="isDesktop" class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.updates.app") }}</h3>

      <div class="opt-row opt-row--col">
        <label class="opt-label">v{{ appUpdate.version || "?" }}</label>
        <div class="opt-folder-path">{{ appUpdateStatusText }}</div>
        <div v-if="appUpdate.status === 'downloading'" class="opt-progress">
          <div class="opt-progress-bar" :style="{ width: appUpdate.progress + '%' }" />
          <span class="opt-progress-label">{{ appUpdate.progress }}%</span>
        </div>
        <div class="opt-folder-actions">
          <button
            v-if="['idle', 'not-available', 'available', 'error'].includes(appUpdate.status)"
            type="button"
            class="opt-btn"
            @click="checkAppUpdate"
          >
            <v-icon icon="mdi-refresh" size="14" class="mr-1" />
            {{ $t("options.updates.check") }}
          </button>
          <button
            v-if="appUpdate.status === 'available'"
            type="button"
            class="opt-btn opt-btn--primary"
            @click="downloadAppUpdate"
          >
            <v-icon icon="mdi-download" size="14" class="mr-1" />
            {{ $t("options.updates.download") }}
          </button>
          <button
            v-if="appUpdate.status === 'downloaded'"
            type="button"
            class="opt-btn opt-btn--primary"
            @click="installAppUpdate"
          >
            <v-icon icon="mdi-restart" size="14" class="mr-1" />
            {{ $t("options.updates.install") }}
          </button>
        </div>
      </div>
    </section>

    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.updates.database") }}</h3>
      <div class="opt-row opt-row--col">
        <div class="opt-folder-path">{{ dbUpdateStatusText }}</div>
        <div class="opt-folder-actions">
          <button type="button" class="opt-btn" :disabled="dbChecking" @click="checkDbUpdate">
            <v-icon icon="mdi-refresh" size="14" class="mr-1" />
            {{ $t("options.updates.check") }}
          </button>
          <button
            v-if="dbHasUpdate"
            type="button"
            class="opt-btn opt-btn--primary"
            @click="applyDbUpdate"
          >
            <v-icon icon="mdi-cloud-download" size="14" class="mr-1" />
            {{ $t("options.updates.apply") }}
          </button>
          <button type="button" class="opt-btn" @click="clearDbCache">
            <v-icon icon="mdi-broom" size="14" class="mr-1" />
            {{ $t("options.updates.clear_cache") }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import Platform from "@/helpers/Platform";

const isDesktop = computed(() => Platform.isDesktop);
const { t } = useI18n();

const appUpdate = ref({ status: "idle", version: "?", progress: 0, newVersion: null, error: null });
let _appUpdateUnsub = null;

const dbChecking = ref(false);
const dbStatus = ref("idle");
const dbCurrentVersion = ref(null);
const dbLatestVersion = ref(null);
const dbCacheCleared = ref(false);

const dbHasUpdate = computed(
  () =>
    dbLatestVersion.value &&
    dbCurrentVersion.value &&
    dbLatestVersion.value !== dbCurrentVersion.value
);

const appUpdateStatusText = computed(() => {
  switch (appUpdate.value.status) {
    case "checking":
      return t("options.updates.app_checking");
    case "available":
      return t("options.updates.app_available", { version: appUpdate.value.newVersion });
    case "not-available":
      return t("options.updates.app_up_to_date");
    case "downloading":
      return t("options.updates.app_downloading");
    case "downloaded":
      return t("options.updates.app_downloaded");
    case "error":
      return appUpdate.value.error || t("options.updates.app_error");
    default:
      return t("options.updates.app_idle");
  }
});

const dbUpdateStatusText = computed(() => {
  if (dbCacheCleared.value) return t("options.updates.cache_cleared");
  if (dbChecking.value) return t("options.updates.db_checking");
  if (dbStatus.value === "ok")
    return (
      t("options.updates.db_up_to_date") +
      (dbCurrentVersion.value ? ` (v${dbCurrentVersion.value})` : "")
    );
  if (dbStatus.value === "available")
    return t("options.updates.db_available", { version: dbLatestVersion.value });
  if (dbStatus.value === "error") return t("options.updates.db_error");
  return t("options.updates.db_idle");
});

async function checkAppUpdate() {
  if (!Platform.updater) return;
  try {
    await Platform.updater.check();
    appUpdate.value = await Platform.updater.status();
  } catch (e) {
    console.error("[Atualizações] checkApp:", e);
  }
}

async function downloadAppUpdate() {
  await Platform.updater?.download();
}
async function installAppUpdate() {
  await Platform.updater?.install();
}

async function checkDbUpdate() {
  dbChecking.value = true;
  dbStatus.value = "idle";
  try {
    const res = await fetch(`${import.meta.env.VITE_URL_DATABASE}/config`, {
      headers: { "Api-Token": import.meta.env.VITE_API_TOKEN },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    dbLatestVersion.value = data?.version ?? null;
    dbCurrentVersion.value = import.meta.env.VITE_APP_VERSION ?? "—";
    dbStatus.value = dbHasUpdate.value ? "available" : "ok";
  } catch {
    dbStatus.value = "error";
  } finally {
    dbChecking.value = false;
  }
}

function applyDbUpdate() {
  sessionStorage.clear();
  window.location.reload();
}

function clearDbCache() {
  sessionStorage.clear();
  dbCacheCleared.value = true;
  setTimeout(() => {
    dbCacheCleared.value = false;
  }, 4000);
}

onMounted(async () => {
  if (Platform.isDesktop && Platform.updater) {
    try {
      appUpdate.value = await Platform.updater.status();
      _appUpdateUnsub = Platform.updater.onStateChange((s) => {
        appUpdate.value = s;
      });
    } catch (e) {
      console.warn("[Atualizações] init:", e);
    }
  }
  await checkDbUpdate();
});

onBeforeUnmount(() => {
  if (_appUpdateUnsub) _appUpdateUnsub();
});
</script>
