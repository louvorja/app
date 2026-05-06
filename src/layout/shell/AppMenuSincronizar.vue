<template>
  <div class="opt">
    <section v-if="!isDesktop" class="opt-section">
      <p class="opt-hint">{{ $t("options.collections_download.desktop_only") }}</p>
    </section>

    <section v-else class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.collections_download.connection") }}</h3>
      <div class="opt-row opt-row--col">
        <div class="opt-folder-path">{{ ftpStatusText }}</div>
        <div class="opt-folder-actions">
          <button type="button" class="opt-btn" :disabled="ftpChecking" @click="checkFtpConnection">
            <v-icon icon="mdi-lan-connect" size="14" class="mr-1" />
            {{ $t("options.collections_download.check_connection") }}
          </button>
        </div>
      </div>
    </section>

    <section v-if="isDesktop" class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.collections_download.title") }}</h3>

      <div v-if="downloadCategories.length" class="opt-row opt-row--col">
        <div class="opt-folder-actions" style="margin-bottom: 6px">
          <button type="button" class="opt-btn opt-btn--small" @click="selectAllDownloads">
            {{ $t("options.collections_download.select_all") }}
          </button>
          <button type="button" class="opt-btn opt-btn--small" @click="deselectAllDownloads">
            {{ $t("options.collections_download.clear") }}
          </button>
        </div>
        <div class="opt-download-list">
          <label v-for="cat in downloadCategories" :key="cat.id_category" class="opt-checkbox">
            <input
              type="checkbox"
              :checked="selectedDownloads.includes(cat.id_category)"
              @change="toggleDownloadCategory(cat.id_category, $event.target.checked)"
            />
            <span>{{ cat.name }}</span>
            <small v-if="cat.albums" class="opt-download-count">
              · {{ cat.albums.length }} {{ $t("options.collections_download.albums") }}
            </small>
          </label>
        </div>
      </div>

      <div v-if="downloading" class="opt-row opt-row--col">
        <label class="opt-label">
          {{
            $t("options.collections_download.progress", {
              done: downloadedCount,
              total: totalDownloads,
              percent: downloadPercent,
            })
          }}
        </label>
        <div class="opt-progress">
          <div class="opt-progress-bar" :style="{ width: downloadPercent + '%' }" />
        </div>
        <div v-if="currentDownloadFile" class="opt-folder-path">
          {{ currentDownloadFile }}
        </div>
      </div>

      <div class="opt-folder-actions">
        <button
          v-if="!downloading"
          type="button"
          class="opt-btn opt-btn--primary"
          :disabled="!ftpOk || !selectedDownloads.length"
          @click="startDownloads"
        >
          <v-icon icon="mdi-cloud-download" size="14" class="mr-1" />
          {{ $t("options.collections_download.start") }}
        </button>
        <button
          v-if="downloading"
          type="button"
          class="opt-btn opt-btn--danger"
          @click="cancelDownloads"
        >
          <v-icon icon="mdi-cancel" size="14" class="mr-1" />
          {{ $t("options.collections_download.cancel") }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import Platform from "@/helpers/Platform";
import Database from "@/helpers/Database";

const isDesktop = computed(() => Platform.isDesktop);
const { t, locale } = useI18n();

const ftpChecking = ref(false);
const ftpOk = ref(false);
const ftpHost = ref(null);
const ftpError = ref(null);
const downloadCategories = ref([]);
const selectedDownloads = ref([]);
const downloading = ref(false);
const currentDownloadFile = ref(null);
const downloadedCount = ref(0);
const failedDownloadCount = ref(0);
const totalDownloads = ref(0);
let _downloadCleanup = [];

const downloadPercent = computed(() =>
  totalDownloads.value > 0 ? Math.round((downloadedCount.value / totalDownloads.value) * 100) : 0
);

const ftpStatusText = computed(() => {
  if (ftpChecking.value) return t("options.collections_download.checking");
  if (ftpOk.value)
    return ftpHost.value ? `FTP: ${ftpHost.value}` : t("options.collections_download.connected");
  if (ftpError.value) return ftpError.value;
  return t("options.collections_download.disconnected");
});

async function loadDownloadCategories() {
  try {
    const data = await Database.get(`${locale.value}_categories`);
    if (data) {
      downloadCategories.value = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  } catch (e) {
    console.error("[Sincronizar] loadCategories:", e);
  }
}

async function checkFtpConnection() {
  if (!Platform.download) return;
  ftpChecking.value = true;
  ftpOk.value = false;
  ftpError.value = null;
  try {
    const r = await Platform.download.checkConnection();
    if (r.ok) {
      ftpOk.value = true;
      ftpHost.value = r.host;
      if (r.msg) {
        ftpOk.value = false;
        ftpError.value = r.msg;
      }
    } else {
      ftpError.value = r.error || t("options.collections_download.disconnected");
    }
  } catch (e) {
    ftpError.value = e.message;
  } finally {
    ftpChecking.value = false;
  }
}

function toggleDownloadCategory(id, checked) {
  if (checked) {
    if (!selectedDownloads.value.includes(id)) selectedDownloads.value.push(id);
  } else {
    selectedDownloads.value = selectedDownloads.value.filter((x) => x !== id);
  }
}

function selectAllDownloads() {
  selectedDownloads.value = downloadCategories.value.map((c) => c.id_category);
}

function deselectAllDownloads() {
  selectedDownloads.value = [];
}

function buildFileList() {
  const files = [];
  const sel = downloadCategories.value.filter((c) =>
    selectedDownloads.value.includes(c.id_category)
  );
  sel.forEach((cat) => {
    cat.albums?.forEach((album) => {
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

async function startDownloads() {
  if (!Platform.download || !ftpOk.value) return;
  const files = buildFileList();
  if (!files.length) return;

  downloading.value = true;
  downloadedCount.value = 0;
  failedDownloadCount.value = 0;
  totalDownloads.value = files.length;
  currentDownloadFile.value = null;

  _downloadCleanup.push(
    Platform.download.onProgress((d) => {
      currentDownloadFile.value = d.file ? d.file.split("/").pop() : null;
      downloadedCount.value = d.current - 1;
      totalDownloads.value = d.total;
    })
  );
  _downloadCleanup.push(
    Platform.download.onFileDone(() => {
      downloadedCount.value++;
    })
  );
  _downloadCleanup.push(
    Platform.download.onFileError(() => {
      failedDownloadCount.value++;
    })
  );
  _downloadCleanup.push(
    Platform.download.onQueueDone(() => {
      downloading.value = false;
      currentDownloadFile.value = null;
      cleanup();
    })
  );
  _downloadCleanup.push(
    Platform.download.onQueueCancelled(() => {
      downloading.value = false;
      currentDownloadFile.value = null;
      cleanup();
    })
  );

  try {
    await Platform.download.start(files);
  } catch (e) {
    downloading.value = false;
    ftpError.value = e.message;
    cleanup();
  }
}

function cancelDownloads() {
  Platform.download?.cancel();
}

function cleanup() {
  _downloadCleanup.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
  _downloadCleanup = [];
}

onMounted(async () => {
  if (!isDesktop.value) return;
  await loadDownloadCategories();
  await checkFtpConnection();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>
