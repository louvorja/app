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

      <p class="opt-hint">{{ $t("options.collections_download.hint") }}</p>

      <div v-if="loadingCategories" class="opt-folder-path">
        {{ $t("options.collections_download.loading") }}
      </div>

      <div v-else-if="categories.length" class="opt-row opt-row--col">
        <div class="opt-folder-actions" style="margin-bottom: 6px">
          <button
            type="button"
            class="opt-btn opt-btn--small"
            :disabled="downloading || preparing"
            @click="selectAllAlbums"
          >
            {{ $t("options.collections_download.select_all") }}
          </button>
          <button
            type="button"
            class="opt-btn opt-btn--small"
            :disabled="downloading || preparing"
            @click="deselectAllAlbums"
          >
            {{ $t("options.collections_download.clear") }}
          </button>
        </div>

        <div class="opt-download-list">
          <div v-for="cat in categories" :key="cat.id_category" class="opt-cat">
            <label class="opt-checkbox opt-cat-header">
              <input
                type="checkbox"
                :checked="isCategoryFullySelected(cat)"
                :indeterminate.prop="isCategoryPartiallySelected(cat)"
                :disabled="downloading || preparing"
                @change="toggleCategory(cat, $event.target.checked)"
              />
              <strong>{{ cat.name }}</strong>
              <small v-if="cat.albums" class="opt-download-count">
                · {{ cat.albums.length }} {{ $t("options.collections_download.albums") }}
              </small>
            </label>

            <div class="opt-cat-albums">
              <label
                v-for="album in cat.albums || []"
                :key="album.id_album"
                class="opt-checkbox opt-album"
              >
                <input
                  type="checkbox"
                  :checked="selectedAlbums.has(album.id_album)"
                  :disabled="downloading || preparing"
                  @change="toggleAlbum(album.id_album, $event.target.checked)"
                />
                <span>{{ album.name }}</span>
                <small v-if="album.subtitle" class="opt-download-count">
                  · {{ album.subtitle }}
                </small>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div v-if="preparing" class="opt-row opt-row--col">
        <div class="opt-folder-path">
          {{
            $t("options.collections_download.preparing", { done: prepareDone, total: prepareTotal })
          }}
        </div>
        <div class="opt-progress">
          <div
            class="opt-progress-bar"
            :style="{ width: prepareTotal > 0 ? (prepareDone / prepareTotal) * 100 + '%' : '0%' }"
          />
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
        <div v-if="failedDownloadCount > 0" class="opt-hint">
          {{ $t("options.collections_download.failed", { n: failedDownloadCount }) }}
        </div>
      </div>

      <div v-if="completedMsg" class="opt-folder-path">
        {{ completedMsg }}
      </div>

      <div class="opt-folder-actions">
        <button
          v-if="!downloading && !preparing"
          type="button"
          class="opt-btn opt-btn--primary"
          :disabled="!ftpOk || selectedAlbums.size === 0"
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

const loadingCategories = ref(false);
const categories = ref([]);
const selectedAlbums = ref(new Set());

const preparing = ref(false);
const prepareDone = ref(0);
const prepareTotal = ref(0);

const downloading = ref(false);
const currentDownloadFile = ref(null);
const downloadedCount = ref(0);
const failedDownloadCount = ref(0);
const totalDownloads = ref(0);
const completedMsg = ref(null);
let _cleanup = [];

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

function isCategoryFullySelected(cat) {
  if (!cat.albums?.length) return false;
  return cat.albums.every((a) => selectedAlbums.value.has(a.id_album));
}
function isCategoryPartiallySelected(cat) {
  if (!cat.albums?.length) return false;
  const selectedCount = cat.albums.filter((a) => selectedAlbums.value.has(a.id_album)).length;
  return selectedCount > 0 && selectedCount < cat.albums.length;
}
function toggleCategory(cat, checked) {
  cat.albums?.forEach((a) => {
    if (checked) selectedAlbums.value.add(a.id_album);
    else selectedAlbums.value.delete(a.id_album);
  });
  selectedAlbums.value = new Set(selectedAlbums.value);
}
function toggleAlbum(id, checked) {
  if (checked) selectedAlbums.value.add(id);
  else selectedAlbums.value.delete(id);
  selectedAlbums.value = new Set(selectedAlbums.value);
}
function selectAllAlbums() {
  const all = new Set();
  categories.value.forEach((c) => c.albums?.forEach((a) => all.add(a.id_album)));
  selectedAlbums.value = all;
}
function deselectAllAlbums() {
  selectedAlbums.value = new Set();
}

async function loadCategories() {
  loadingCategories.value = true;
  try {
    const data = await Database.get(`${locale.value}_categories`);
    if (data) {
      categories.value = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  } catch (e) {
    console.error("[Sincronizar] loadCategories:", e);
  } finally {
    loadingCategories.value = false;
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

/** Normaliza caminho remoto/local: garante que comece com `/`, e local sem `/` no início. */
function toFile(url) {
  if (!url) return null;
  const remote = url.startsWith("/") ? url : `/${url}`;
  const local = remote.slice(1);
  return { remote, local, expectedSize: 0 };
}

/** Baixa um JSON do banco com fallback simples. */
async function fetchJson(key) {
  try {
    return await Database.get(key);
  } catch (e) {
    console.warn(`[Sincronizar] fetchJson(${key}):`, e);
    return null;
  }
}

/** Coleta lista de arquivos para sincronizar a partir dos álbuns selecionados.
 *  - Capa do álbum (url_image)
 *  - Para cada música do álbum: url_music, url_instrumental_music, url_image,
 *    e url_image de cada slide da letra.
 *  Faz fetch concorrente das músicas com batches de 8. */
async function collectFiles(albumIds) {
  const files = new Map(); // dedup por remote path

  function pushFile(url) {
    const f = toFile(url);
    if (f) files.set(f.remote, f);
  }

  prepareTotal.value = albumIds.length;
  prepareDone.value = 0;

  // Etapa 1: para cada álbum, baixar JSON do álbum e adicionar capa + lista de music_ids
  const allMusicIds = new Set();
  const albumPromises = albumIds.map(async (id) => {
    const album =
      (await fetchJson(`${locale.value}_album_${id}`).catch(() => null)) ||
      (await fetchJson(`album_${id}`));
    if (!album) return;
    pushFile(album.url_image);
    album.musics?.forEach((m) => allMusicIds.add(m.id_music));
    prepareDone.value += 1;
  });
  await Promise.all(albumPromises);

  // Etapa 2: para cada música, baixar JSON e coletar arquivos
  const musicIds = [...allMusicIds];
  prepareTotal.value = albumIds.length + musicIds.length;
  const BATCH = 8;
  for (let i = 0; i < musicIds.length; i += BATCH) {
    const slice = musicIds.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (mid) => {
        const m = await fetchJson(`music_${mid}`);
        if (!m) return;
        pushFile(m.url_music);
        pushFile(m.url_instrumental_music);
        pushFile(m.url_image);
        m.lyric?.forEach((line) => pushFile(line.url_image));
        prepareDone.value += 1;
      })
    );
  }

  return [...files.values()];
}

async function startDownloads() {
  if (!Platform.download || !ftpOk.value) return;
  if (selectedAlbums.value.size === 0) return;

  completedMsg.value = null;
  preparing.value = true;
  prepareDone.value = 0;
  prepareTotal.value = 0;

  let files = [];
  try {
    files = await collectFiles([...selectedAlbums.value]);
  } catch (e) {
    console.error("[Sincronizar] collectFiles:", e);
    preparing.value = false;
    completedMsg.value = t("options.collections_download.collect_failed");
    return;
  }
  preparing.value = false;

  if (files.length === 0) {
    completedMsg.value = t("options.collections_download.no_files");
    return;
  }

  downloading.value = true;
  downloadedCount.value = 0;
  failedDownloadCount.value = 0;
  totalDownloads.value = files.length;
  currentDownloadFile.value = null;

  _cleanup.push(
    Platform.download.onProgress((d) => {
      currentDownloadFile.value = d.file ? d.file.split("/").pop() : null;
      downloadedCount.value = Math.max(0, d.current - 1);
      totalDownloads.value = d.total;
    })
  );
  _cleanup.push(
    Platform.download.onFileDone(() => {
      downloadedCount.value++;
    })
  );
  _cleanup.push(
    Platform.download.onFileError(() => {
      failedDownloadCount.value++;
    })
  );
  _cleanup.push(
    Platform.download.onQueueDone((d) => {
      downloading.value = false;
      currentDownloadFile.value = null;
      completedMsg.value = t("options.collections_download.completed", {
        downloaded: d?.downloaded ?? downloadedCount.value,
        failed: d?.failed ?? failedDownloadCount.value,
      });
      cleanup();
    })
  );
  _cleanup.push(
    Platform.download.onQueueCancelled(() => {
      downloading.value = false;
      currentDownloadFile.value = null;
      completedMsg.value = t("options.collections_download.cancelled");
      cleanup();
    })
  );

  try {
    await Platform.download.start(files);
  } catch (e) {
    downloading.value = false;
    ftpError.value = e.message;
    completedMsg.value = e.message;
    cleanup();
  }
}

function cancelDownloads() {
  Platform.download?.cancel();
}

function cleanup() {
  _cleanup.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
  _cleanup = [];
}

onMounted(async () => {
  if (!isDesktop.value) return;
  await loadCategories();
  await checkFtpConnection();
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style scoped>
.opt-cat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.15);
}
.opt-cat:last-child {
  border-bottom: 0;
}
.opt-cat-header {
  font-size: var(--lj-text-base);
}
.opt-cat-albums {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 24px;
}
.opt-album {
  font-size: var(--lj-text-sm);
}
</style>
