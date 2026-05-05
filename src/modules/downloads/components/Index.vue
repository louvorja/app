<template>
  <ModuleContainer
    ref="moduleContainer"
    :manifest="manifest"
    :style="{ minWidth: '380px' }"
    @close="close()"
  >
    <!-- Desktop only guard -->
    <div v-if="!isDesktop" class="pa-6 d-flex flex-column align-center" style="gap: 16px">
      <v-icon icon="mdi-monitor-off" size="48" color="grey" />
      <div class="text-body-1 text-center text-medium-emphasis">{{ t("data.desktop_only") }}</div>
    </div>

    <!-- Main UI (desktop only) -->
    <div v-else class="d-flex flex-column" style="gap: 0">
      <!-- Connection status bar -->
      <div
        class="pa-3 d-flex align-center"
        style="gap: 8px; border-bottom: 1px solid rgba(128, 128, 128, 0.2)"
      >
        <v-icon :icon="connectionIcon" :color="connectionColor" size="20" />
        <span class="text-body-2 flex-grow-1">{{ connectionText }}</span>
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-lan-connect"
          :loading="checkingConnection"
          @click="checkConnection"
        >
          {{ t("actions.check") }}
        </v-btn>
      </div>

      <!-- Download progress -->
      <div
        v-if="downloading"
        class="pa-3"
        style="border-bottom: 1px solid rgba(128, 128, 128, 0.2)"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-truncate" style="max-width: 260px">
            {{ currentFile ? t("data.downloading").replace("{file}", currentFile) : "..." }}
          </span>
          <span class="text-caption text-medium-emphasis">
            {{
              t("data.progress")
                .replace("{done}", downloadedCount)
                .replace("{total}", totalFiles)
                .replace(
                  "{percent}",
                  totalFiles > 0 ? Math.round((downloadedCount / totalFiles) * 100) : 0
                )
            }}
          </span>
        </div>
        <v-progress-linear
          :model-value="totalFiles > 0 ? (downloadedCount / totalFiles) * 100 : 0"
          :color="primaryColor"
          height="6"
          rounded
        />
      </div>

      <!-- Completed result -->
      <v-alert
        v-if="completedMsg"
        :type="failedCount > 0 ? 'warning' : 'success'"
        :text="completedMsg"
        density="compact"
        class="ma-2"
        closable
        @click:close="completedMsg = null"
      />

      <!-- Categories list -->
      <div class="pa-2">
        <div class="d-flex align-center justify-space-between px-2 py-1">
          <span class="text-subtitle-2 text-medium-emphasis">{{ t("data.available") }}</span>
          <div class="d-flex" style="gap: 4px">
            <v-btn size="x-small" variant="text" @click="selectAll">
              {{ t("actions.select_all") }}
            </v-btn>
            <v-btn size="x-small" variant="text" @click="deselectAll">
              {{ t("actions.deselect_all") }}
            </v-btn>
          </div>
        </div>

        <v-progress-linear
          v-if="loadingCategories"
          :color="primaryColor"
          indeterminate
          class="mb-2"
        />

        <div
          v-if="!loadingCategories && categories.length === 0"
          class="text-center text-medium-emphasis py-4 text-caption"
        >
          {{ t("data.no_connection") }}
        </div>

        <v-list density="compact" class="pa-0">
          <v-list-item
            v-for="cat in categories"
            :key="cat.id_category"
            :value="cat.id_category"
            rounded="lg"
            class="mb-1"
          >
            <template #prepend>
              <v-checkbox-btn
                v-model="selected"
                :value="cat.id_category"
                :color="primaryColor"
                density="compact"
              />
            </template>

            <v-list-item-title class="text-body-2">{{ cat.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ cat.albums ? t("data.album_count").replace("{n}", cat.albums.length) : "" }}
            </v-list-item-subtitle>

            <template #append>
              <v-chip size="x-small" :color="statusColor(cat)" variant="tonal" class="ml-2">
                {{ statusLabel(cat) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Action buttons -->
      <div
        class="pa-3 d-flex justify-end align-center"
        style="gap: 8px; border-top: 1px solid rgba(128, 128, 128, 0.2)"
      >
        <v-btn
          v-if="!downloading"
          variant="tonal"
          prepend-icon="mdi-select-all"
          :disabled="!connectionOk"
          @click="downloadAll"
        >
          {{ t("actions.download_all") }}
        </v-btn>

        <template v-if="downloading">
          <v-btn v-if="!paused" variant="tonal" prepend-icon="mdi-pause" @click="pauseDownload">
            {{ t("actions.pause") }}
          </v-btn>
          <v-btn
            v-else
            :color="primaryColor"
            variant="tonal"
            prepend-icon="mdi-play"
            @click="resumeDownload"
          >
            {{ t("actions.resume") }}
          </v-btn>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-cancel" @click="cancelDownload">
            {{ t("actions.cancel") }}
          </v-btn>
        </template>

        <v-btn
          v-if="!downloading"
          :color="primaryColor"
          prepend-icon="mdi-cloud-download"
          :disabled="selected.length === 0 || !connectionOk"
          :loading="downloading"
          @click="startDownload"
        >
          {{ t("actions.download") }}
        </v-btn>
      </div>
    </div>
  </ModuleContainer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import manifest from "../manifest.json";
import ModuleContainer from "@/components/ModuleContainer.vue";
import Platform from "@/helpers/Platform";
import Database from "@/helpers/Database";
import AppData from "@/helpers/AppData";

const { locale } = useI18n();

const moduleContainer = ref(null);
const isDesktop = Platform.isDesktop;

const checkingConnection = ref(false);
const connectionOk = ref(false);
const connectionHost = ref(null);
const connectionError = ref(null);

const loadingCategories = ref(false);
const categories = ref([]);
const selected = ref([]);

const downloading = ref(false);
const paused = ref(false);
const currentFile = ref(null);
const downloadedCount = ref(0);
const failedCount = ref(0);
const totalFiles = ref(0);
const completedMsg = ref(null);

let cleanupListeners = [];

const primaryColor = computed(() => (AppData.get("is_dark") ? undefined : "primary"));

const connectionIcon = computed(() => {
  if (checkingConnection.value) return "mdi-cloud-sync-outline";
  if (connectionOk.value) return "mdi-check-circle-outline";
  if (connectionError.value) return "mdi-alert-circle-outline";
  return "mdi-cloud-outline";
});

const connectionColor = computed(() => {
  if (connectionOk.value) return "success";
  if (connectionError.value) return "error";
  return "grey";
});

const connectionText = computed(() => {
  if (checkingConnection.value) return t("data.checking");
  if (connectionOk.value)
    return connectionHost.value ? `FTP: ${connectionHost.value}` : "Conectado";
  if (connectionError.value) return connectionError.value;
  return t("data.no_connection");
});

const t = (key) => moduleContainer.value?.t(key) || key;

onMounted(async () => {
  if (isDesktop) {
    await loadCategories();
    await checkConnection();
  }
});

onBeforeUnmount(() => {
  removeListeners();
});

function statusColor(_cat) {
  return "grey";
}

function statusLabel(_cat) {
  return t("data.available");
}

function selectAll() {
  selected.value = categories.value.map((c) => c.id_category);
}

function deselectAll() {
  selected.value = [];
}

async function loadCategories() {
  loadingCategories.value = true;
  try {
    const data = await Database.get(`${locale.value}_categories`);
    if (data) {
      categories.value = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  } catch (e) {
    console.error("[downloads] Erro ao carregar categorias:", e);
  } finally {
    loadingCategories.value = false;
  }
}

async function checkConnection() {
  if (!Platform.download) return;
  checkingConnection.value = true;
  connectionOk.value = false;
  connectionError.value = null;
  try {
    const result = await Platform.download.checkConnection();
    if (result.ok) {
      connectionOk.value = true;
      connectionHost.value = result.host;
      if (result.msg) {
        connectionOk.value = false;
        connectionError.value = result.msg;
      }
    } else {
      connectionError.value = result.error || t("data.no_connection");
    }
  } catch (e) {
    connectionError.value = e.message;
  } finally {
    checkingConnection.value = false;
  }
}

function buildFileList() {
  const files = [];
  const selectedCats = categories.value.filter((c) => selected.value.includes(c.id_category));
  selectedCats.forEach((cat) => {
    if (!cat.albums) return;
    cat.albums.forEach((album) => {
      if (album.url_image) {
        files.push({
          remote: album.url_image.startsWith("/") ? album.url_image : `/${album.url_image}`,
          local: album.url_image.startsWith("/") ? album.url_image.slice(1) : album.url_image,
          expectedSize: 0,
        });
      }
    });
  });
  return files;
}

async function startDownload() {
  if (!Platform.download || !connectionOk.value) return;

  const files = buildFileList();
  if (files.length === 0) {
    completedMsg.value = "Nenhum arquivo encontrado para baixar.";
    return;
  }

  downloading.value = true;
  downloadedCount.value = 0;
  failedCount.value = 0;
  totalFiles.value = files.length;
  currentFile.value = null;
  completedMsg.value = null;

  cleanupListeners.push(
    Platform.download.onProgress((data) => {
      currentFile.value = data.file ? data.file.split("/").pop() : null;
      downloadedCount.value = data.current - 1;
      totalFiles.value = data.total;
    })
  );
  cleanupListeners.push(
    Platform.download.onFileDone(() => {
      downloadedCount.value++;
    })
  );
  cleanupListeners.push(
    Platform.download.onFileError(() => {
      failedCount.value++;
    })
  );
  cleanupListeners.push(
    Platform.download.onQueueDone((data) => {
      downloading.value = false;
      currentFile.value = null;
      completedMsg.value = t("data.completed")
        .replace("{downloaded}", data.downloaded)
        .replace("{failed}", data.failed);
      removeListeners();
    })
  );
  cleanupListeners.push(
    Platform.download.onQueueCancelled(() => {
      downloading.value = false;
      currentFile.value = null;
      removeListeners();
    })
  );

  try {
    await Platform.download.start(files);
  } catch (e) {
    downloading.value = false;
    connectionError.value = e.message;
    removeListeners();
  }
}

function cancelDownload() {
  if (Platform.download) {
    Platform.download.cancel();
  }
  paused.value = false;
}

async function pauseDownload() {
  if (Platform.download?.pause) {
    await Platform.download.pause();
    paused.value = true;
  }
}

async function resumeDownload() {
  if (Platform.download?.resume) {
    await Platform.download.resume();
    paused.value = false;
  }
}

async function downloadAll() {
  if (!categories.value || categories.value.length === 0) return;
  selected.value = categories.value.map((c) => c.id_category);
  await startDownload();
}

function removeListeners() {
  cleanupListeners.forEach((fn) => {
    try {
      fn();
    } catch (_) {
      /* ignore */
    }
  });
  cleanupListeners = [];
}

function close() {
  if (downloading.value) {
    Platform.download?.cancel();
  }
  removeListeners();
}
</script>
