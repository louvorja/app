<template>
  <div class="opt">
    <!-- Geral -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.general.title") }}</h3>

      <div class="opt-row">
        <label class="opt-label" for="opt-theme">{{ $t("options.general.theme") }}</label>
        <select
          id="opt-theme"
          class="opt-select"
          :value="userdata.theme || 'darkblue'"
          @change="changeTheme($event.target.value)"
        >
          <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.label }}</option>
        </select>
      </div>

      <div class="opt-row">
        <label class="opt-label" for="opt-language">{{ $t("options.general.language") }}</label>
        <select
          id="opt-language"
          class="opt-select"
          :value="userdata.language || 'pt'"
          @change="changeLanguage($event.target.value)"
        >
          <option value="pt">Português</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div v-if="isDesktop" class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.start_with_os"
            @change="toggleStartWithOS($event.target.checked)"
          />
          <span>{{ $t("options.general.start_with_os") }}</span>
        </label>
      </div>
    </section>

    <!-- Monitores -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.monitors.title") }}</h3>

      <div v-if="displays.length === 0" class="opt-empty">
        {{ $t("options.monitors.no_displays") }}
      </div>

      <div v-else>
        <div class="opt-monitors">
          <div
            v-for="d in displays"
            :key="d.id"
            class="opt-monitor"
            :class="{ 'opt-monitor--primary': d.primary }"
          >
            <div class="opt-monitor-num">{{ d.label || `#${d.id}` }}</div>
            <div class="opt-monitor-size">
              {{ d.bounds?.width || "?" }} x {{ d.bounds?.height || "?" }}
            </div>
          </div>
        </div>

        <button type="button" class="opt-btn" @click="identify(5000)">
          {{ $t("options.monitors.identify") }}
        </button>
      </div>
    </section>

    <!-- Slides de Músicas -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.slides.title") }}</h3>

      <div class="opt-row">
        <label class="opt-label" for="opt-slides-monitor">{{ $t("options.slides.open_at") }}</label>
        <select
          id="opt-slides-monitor"
          class="opt-select"
          :value="getPref('musicas') ?? ''"
          @change="setPref('musicas', $event.target.value)"
        >
          <option value="">{{ $t("options.slides.same_window") }}</option>
          <option v-for="d in displays" :key="d.id" :value="d.id">
            {{ d.label || `Monitor ${d.id}` }}
          </option>
        </select>
      </div>

      <div class="opt-row">
        <label class="opt-label" for="opt-slides-align">{{ $t("options.slides.alignment") }}</label>
        <select
          id="opt-slides-align"
          class="opt-select"
          :value="userdata.text_align || 'center'"
          @change="setUd('text_align', $event.target.value)"
        >
          <option value="top">{{ $t("options.slides.align_top") }}</option>
          <option value="center">{{ $t("options.slides.align_center") }}</option>
          <option value="bottom">{{ $t("options.slides.align_bottom") }}</option>
        </select>
      </div>
      <div class="opt-row">
        <label class="opt-label" for="opt-slides-main-text-size">
          {{ $t("options.slides.text_size") }}
        </label>
        <input
          id="opt-slides-main-text-size"
          type="number"
          min="6"
          max="60"
          class="opt-input opt-input--num"
          :value="userdata.text_size ?? 17"
          @input="setUd('text_size', Number($event.target.value) || 17)"
        />
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.fullscreen ?? true"
            @change="setUd('fullscreen', $event.target.checked)"
          />
          <span>{{ $t("options.slides.fullscreen") }}</span>
        </label>
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.always_on_top ?? true"
            @change="setUd('always_on_top', $event.target.checked)"
          />
          <span>{{ $t("options.slides.always_on_top") }}</span>
        </label>
      </div>

      <!--      Configurações da tela do operador  -->
      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.open_operator ?? false"
            @change="setUd('open_operator', $event.target.checked)"
          />
          <span>{{ $t("options.slides.open_operator") }}</span>
        </label>
        <select
          v-if="userdata.open_operator"
          class="opt-select opt-select--inline"
          :aria-label="$t('options.slides.open_operator')"
          :value="getPref('operador') ?? ''"
          @change="setPref('operador', $event.target.value)"
        >
          <option value="">{{ $t("options.slides.same_window") }}</option>
          <option v-for="d in displays" :key="d.id" :value="d.id">
            {{ d.label || `Monitor ${d.id}` }}
          </option>
        </select>
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.open_return ?? false"
            @change="setUd('open_return', $event.target.checked)"
          />
          <span>{{ $t("options.slides.open_return") }}</span>
        </label>
        <select
          v-if="userdata.open_return"
          class="opt-select opt-select--inline"
          :aria-label="$t('options.slides.open_return')"
          :value="getPref('retorno') ?? ''"
          @change="setPref('retorno', $event.target.value)"
        >
          <option value="">{{ $t("options.slides.same_window") }}</option>
          <option v-for="d in displays" :key="d.id" :value="d.id">
            {{ d.label || `Monitor ${d.id}` }}
          </option>
        </select>
      </div>
      <div class="opt-row">
        <label class="opt-label" for="opt-slides-next-text-size">
          {{ $t("options.slides.text_size") }}
        </label>
        <input
          id="opt-slides-next-text-size"
          type="number"
          min="3"
          max="15"
          class="opt-input opt-input--num"
          :value="userdata.slides?.font_size_next ?? 6"
          @input="setUd('slides.font_size_next', Number($event.target.value) || 6)"
        />
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.show_title_first_slide ?? true"
            @change="setUd('show_title_first_slide', $event.target.checked)"
          />
          <span>{{ $t("options.slides.show_title") }}</span>
        </label>
      </div>

      <!-- Formatação de texto personalizada -->
      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.custom_text_format ?? false"
            @change="setUd('custom_text_format', $event.target.checked)"
          />
          <span>{{ $t("options.slides.custom_text_format") }}</span>
        </label>
      </div>
      <div v-if="userdata.custom_text_format" class="opt-format-block">
        <div class="opt-format-row">
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.title_color") }}</span>
            <input
              type="color"
              class="opt-color"
              :value="userdata.title_color ?? '#ffd84d'"
              @input="setUd('title_color', $event.target.value)"
            />
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.text_color") }}</span>
            <input
              type="color"
              class="opt-color"
              :value="userdata.text_color ?? '#ffffff'"
              @input="setUd('text_color', $event.target.value)"
            />
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.repeat_color") }}</span>
            <input
              type="color"
              class="opt-color"
              :value="userdata.repeat_color ?? '#bbbbbb'"
              @input="setUd('repeat_color', $event.target.value)"
            />
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.aux_color") }}</span>
            <input
              type="color"
              class="opt-color"
              :value="userdata.aux_color ?? '#cccccc'"
              @input="setUd('aux_color', $event.target.value)"
            />
          </label>
          <label class="opt-checkbox opt-format-check">
            <input
              type="checkbox"
              :checked="userdata.text_bg_transparent ?? false"
              @change="setUd('text_bg_transparent', $event.target.checked)"
            />
            <span>{{ $t("options.slides.text_bg_transparent") }}</span>
          </label>
        </div>
        <div class="opt-format-row">
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.title_size") }}</span>
            <input
              type="number"
              min="6"
              max="60"
              class="opt-input opt-input--num"
              :value="userdata.title_size ?? 18"
              @input="setUd('title_size', Number($event.target.value) || 18)"
            />
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.text_size_label") }}</span>
            <input
              type="number"
              min="6"
              max="60"
              class="opt-input opt-input--num"
              :value="userdata.body_size ?? 14"
              @input="setUd('body_size', Number($event.target.value) || 14)"
            />
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.aux_size") }}</span>
            <input
              type="number"
              min="6"
              max="60"
              class="opt-input opt-input--num"
              :value="userdata.aux_size ?? 10"
              @input="setUd('aux_size', Number($event.target.value) || 10)"
            />
          </label>
          <button type="button" class="opt-btn opt-btn--ghost" @click="restoreTextFormat">
            <v-icon icon="mdi-refresh" size="14" class="mr-1" />
            {{ $t("options.slides.restore") }}
          </button>
        </div>
      </div>

      <!-- Fundo personalizado -->
      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.custom_background ?? false"
            @change="setUd('custom_background', $event.target.checked)"
          />
          <span>{{ $t("options.slides.custom_background") }}</span>
        </label>
      </div>
      <div v-if="userdata.custom_background" class="opt-format-block">
        <div class="opt-format-row">
          <label class="opt-checkbox opt-format-check">
            <input
              type="checkbox"
              :checked="userdata.bg_transparent ?? false"
              @change="setUd('bg_transparent', $event.target.checked)"
            />
            <span>{{ $t("options.slides.bg_transparent") }}</span>
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.bg_color") }}</span>
            <input
              type="color"
              class="opt-color"
              :value="userdata.bg_color ?? '#000000'"
              @input="setUd('bg_color', $event.target.value)"
            />
          </label>
          <label class="opt-format-field opt-format-field--grow">
            <span class="opt-format-label">{{ $t("options.slides.bg_image") }}</span>
            <input
              type="text"
              class="opt-input"
              :value="userdata.bg_image ?? ''"
              :placeholder="$t('options.slides.bg_image_placeholder')"
              @input="setUd('bg_image', $event.target.value)"
            />
          </label>
          <label class="opt-format-field">
            <span class="opt-format-label">{{ $t("options.slides.bg_position") }}</span>
            <select
              class="opt-select"
              :value="userdata.bg_position ?? 'center'"
              @change="setUd('bg_position', $event.target.value)"
            >
              <option value="center">{{ $t("options.slides.pos_center") }}</option>
              <option value="cover">{{ $t("options.slides.pos_cover") }}</option>
              <option value="contain">{{ $t("options.slides.pos_contain") }}</option>
              <option value="stretch">{{ $t("options.slides.pos_stretch") }}</option>
              <option value="tile">{{ $t("options.slides.pos_tile") }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.affect_external_slides ?? true"
            @change="setUd('affect_external_slides', $event.target.checked)"
          />
          <span>{{ $t("options.slides.affect_external") }}</span>
        </label>
      </div>
    </section>

    <!-- Vídeos On-line -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.videos.title") }}</h3>

      <div class="opt-row">
        <label class="opt-label" for="opt-videos-monitor">{{ $t("options.slides.open_at") }}</label>
        <select
          id="opt-videos-monitor"
          class="opt-select"
          :value="getPref('videos') ?? ''"
          @change="setPref('videos', $event.target.value)"
        >
          <option value="">{{ $t("options.slides.same_window") }}</option>
          <option v-for="d in displays" :key="d.id" :value="d.id">
            {{ d.label || `Monitor ${d.id}` }}
          </option>
        </select>
      </div>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.video_fullscreen ?? true"
            @change="setUd('video_fullscreen', $event.target.checked)"
          />
          <span>{{ $t("options.videos.fullscreen") }}</span>
        </label>
      </div>

      <div class="opt-row">
        <label class="opt-label" for="opt-youtube-action">
          {{ $t("options.videos.youtube_action") }}
        </label>
        <select
          id="opt-youtube-action"
          class="opt-select"
          :value="userdata.youtube_action || 'video'"
          @change="setUd('youtube_action', $event.target.value)"
        >
          <option value="video">{{ $t("options.videos.action_video") }}</option>
          <option value="link">{{ $t("options.videos.action_link") }}</option>
        </select>
      </div>
    </section>

    <!-- Player de Áudio/Vídeo -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.player.title") }}</h3>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="mediaFadeAudio"
            @change="setMedia('fade_audio', $event.target.checked)"
          />
          <span>{{ $t("options.player.fade_audio") }}</span>
        </label>
      </div>
      <p class="opt-hint">{{ $t("options.player.fade_audio_hint") }}</p>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="mediaLazyLoad"
            @change="setMedia('lazy_load', $event.target.checked)"
          />
          <span>{{ $t("options.player.lazy_load") }}</span>
        </label>
      </div>
    </section>

    <!-- Imagem de Fundo -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.background.title") }}</h3>
      <div class="opt-row">
        <label class="opt-format-field">
          <span class="opt-format-label">{{ $t("options.background.color") }}</span>
          <input
            type="color"
            class="opt-color"
            :value="userdata.global_bg_color ?? '#000033'"
            @input="setUd('global_bg_color', $event.target.value)"
          />
        </label>
      </div>
    </section>

    <!-- Armazenamento (S2) -->
    <section v-if="isDesktop" class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.storage.title") }}</h3>

      <!-- Pasta de mídia -->
      <div class="opt-row opt-row--col">
        <label class="opt-label">{{ $t("options.storage.folder") }}</label>
        <div class="opt-folder">
          <code class="opt-folder-path">{{ storageStats?.filesDir || "—" }}</code>
          <div class="opt-folder-actions">
            <button type="button" class="opt-btn" @click="openFolder">
              {{ $t("options.storage.open_folder") }}
            </button>
            <button type="button" class="opt-btn" @click="changeFolder">
              {{ $t("options.storage.change_folder") }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="opt-stats">
        <div class="opt-stat">
          <span class="opt-stat-label">{{ $t("options.storage.media_size") }}</span>
          <span class="opt-stat-value">
            {{ humanSize(storageStats?.files?.bytes) }}
            <small>({{ storageStats?.files?.count || 0 }} arq.)</small>
          </span>
        </div>
        <div class="opt-stat">
          <span class="opt-stat-label">{{ $t("options.storage.cache_size") }}</span>
          <span class="opt-stat-value">
            {{ humanSize(storageStats?.json?.bytes) }}
            <small>({{ storageStats?.json?.count || 0 }} arq.)</small>
          </span>
        </div>
        <div class="opt-stat opt-stat--total">
          <span class="opt-stat-label">{{ $t("options.storage.total") }}</span>
          <span class="opt-stat-value">{{ humanSize(storageStats?.total?.bytes) }}</span>
        </div>
      </div>

      <!-- Auto-cache toggle -->
      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="autoCache"
            @change="toggleAutoCache($event.target.checked)"
          />
          <span>{{ $t("options.storage.auto_cache") }}</span>
        </label>
      </div>
      <p class="opt-hint">{{ $t("options.storage.auto_cache_hint") }}</p>

      <!-- Limite de espaço -->
      <div class="opt-row">
        <label class="opt-label" for="opt-quota">{{ $t("options.storage.quota") }}</label>
        <select
          id="opt-quota"
          class="opt-select"
          :value="quotaGb"
          @change="setQuotaGb(Number($event.target.value))"
        >
          <option :value="0">{{ $t("options.storage.no_limit") }}</option>
          <option :value="1">1 GB</option>
          <option :value="2">2 GB</option>
          <option :value="5">5 GB</option>
          <option :value="10">10 GB</option>
          <option :value="20">20 GB</option>
          <option :value="50">50 GB</option>
        </select>
      </div>
      <p class="opt-hint">{{ $t("options.storage.quota_hint") }}</p>

      <!-- Ações -->
      <div class="opt-actions">
        <button type="button" class="opt-btn" @click="clearJson">
          <v-icon icon="mdi-database-remove" size="14" class="mr-1" />
          {{ $t("options.storage.clear_cache") }}
        </button>
        <button type="button" class="opt-btn opt-btn--danger" @click="clearFiles">
          <v-icon icon="mdi-delete" size="14" class="mr-1" />
          {{ $t("options.storage.clear_files") }}
        </button>
        <button type="button" class="opt-btn" :disabled="loading" @click="reloadStats">
          <v-icon icon="mdi-refresh" size="14" class="mr-1" />
          {{ $t("options.storage.refresh") }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import { useDisplays } from "@/composables/useDisplays";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
import $alert from "@/helpers/Alert";
import Platform from "@/helpers/Platform";

const isDesktop = computed(() => Platform.isDesktop);

const { t, locale } = useI18n();
const theme = useTheme();
const { displays, getPreferred, setPreferred, identify } = useDisplays();

const themes = computed(() =>
  ["light", "darkblue", "blue", "green", "orange", "purple", "pink", "black", "dark"].map((id) => ({
    id,
    label: t(`options.general.themes.${id}`),
  }))
);

// Proxy reativo de userdata.options.* (chaves agrupadas)
const userdata = computed(() => {
  return new Proxy(
    {},
    {
      get: (_, key) => $userdata.get(`options.${String(key)}`, undefined),
    }
  );
});

function setUd(key, value) {
  $userdata.set(`options.${key}`, value);
}

function restoreTextFormat() {
  setUd("title_color", "#ffd84d");
  setUd("text_color", "#ffffff");
  setUd("repeat_color", "#bbbbbb");
  setUd("aux_color", "#cccccc");
  setUd("title_size", 18);
  setUd("body_size", 14);
  setUd("aux_size", 10);
  setUd("text_bg_transparent", false);
}

// Player de mídia: chaves vivem em modules.media.* (lugar onde Media.js lê)
const mediaFadeAudio = computed(() => $userdata.get("modules.media.fade_audio", false) === true);
const mediaLazyLoad = computed(() => $userdata.get("modules.media.lazy_load", true) === true);

function setMedia(key, value) {
  $userdata.set(`modules.media.${key}`, value);
}

function setPref(feature, displayId) {
  const id = displayId === "" ? null : Number(displayId);
  setPreferred(feature, id);
}

function getPref(feature) {
  return getPreferred(feature);
}

function changeTheme(selectedTheme) {
  setUd("theme", selectedTheme);
  theme.change(selectedTheme);
  $userdata.set("theme", selectedTheme);
  // Aplica também no <html> via data-theme. As variáveis CSS dos themes
  // (--lj-navy*) ficam em [data-theme="<id>"], que herda para todo o
  // documento. Mais robusto que depender de onde o Vuetify monta a classe.
  document.documentElement.dataset.theme = selectedTheme;
  const isDark = selectedTheme === "dark";
  $appdata.set("is_dark", isDark);
  if (!isDark) $userdata.set("theme_last_light", selectedTheme);
}

function changeLanguage(lang) {
  setUd("language", lang);
  locale.value = lang;
  $userdata.set("language", lang);
}

async function toggleStartWithOS(enabled) {
  setUd("start_with_os", !!enabled);
  const api = Platform?.appLogin;
  if (api?.set) {
    try {
      await api.set(!!enabled);
    } catch (e) {
      console.warn("[AppMenuOpcoes] setLoginItem falhou:", e);
    }
  }
}

onMounted(async () => {
  const api = Platform?.appLogin;
  if (api?.get) {
    try {
      const cur = await api.get();
      if (cur && typeof cur.openAtLogin === "boolean") {
        $userdata.set("options.start_with_os", cur.openAtLogin);
      }
    } catch {
      /* ignore */
    }
  }
  await reloadStats();
});

// ─── Storage (S2) ───────────────────────────────────────────────────────
const storageStats = ref(null);
const loading = ref(false);

const autoCache = computed({
  get: () => $userdata.get("options.auto_cache_media", true) !== false,
  set: (v) => $userdata.set("options.auto_cache_media", !!v),
});

const quotaGb = computed({
  get: () => Number($userdata.get("options.storage_quota_gb", 0)) || 0,
  set: (v) => $userdata.set("options.storage_quota_gb", Number(v) || 0),
});

function humanSize(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let val = Number(bytes);
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(val < 10 ? 1 : 0)} ${units[i]}`;
}

async function reloadStats() {
  if (!Platform?.storage?.stats) return;
  loading.value = true;
  try {
    storageStats.value = await Platform.storage.stats();
  } catch (e) {
    console.warn("[Opcoes] storage.stats falhou:", e);
  } finally {
    loading.value = false;
  }
}

async function openFolder() {
  await Platform?.storage?.openDir?.();
}

async function changeFolder() {
  const newDir = await Platform?.storage?.chooseDir?.();
  if (!newDir) return;
  $alert.yesno("options.storage.move_confirm", async (btn) => {
    if (btn === "cancel") return;
    const move = btn === "yes";
    try {
      await Platform.storage.setFilesDir(newDir, { moveExisting: move });
      // Persiste em userStore para aplicar no próximo boot
      const cur = (await Platform.userStore?.read("storage")) || {};
      await Platform.userStore?.write("storage", { ...cur, filesDir: newDir });
      await reloadStats();
    } catch (e) {
      $alert.error({ text: "options.storage.change_failed", error: e });
    }
  });
}

async function toggleAutoCache(enabled) {
  $userdata.set("options.auto_cache_media", !!enabled);
  if (Platform?.storage?.setAutoCache) {
    await Platform.storage.setAutoCache(!!enabled);
  }
  // Persiste em userStore para o boot do próximo session
  const cur = (await Platform.userStore?.read("storage")) || {};
  await Platform.userStore?.write("storage", { ...cur, autoCache: !!enabled });
}

async function setQuotaGb(gb) {
  $userdata.set("options.storage_quota_gb", gb);
  const maxBytes = gb > 0 ? gb * 1024 * 1024 * 1024 : 0;
  const cur = (await Platform.userStore?.read("storage")) || {};
  await Platform.userStore?.write("storage", { ...cur, maxBytes });
  if (maxBytes > 0 && Platform?.storage?.enforceQuota) {
    await Platform.storage.enforceQuota(maxBytes);
    await reloadStats();
  }
}

async function clearJson() {
  $alert.yesno("options.storage.clear_cache_confirm", async (btn) => {
    if (btn !== "yes") return;
    await Platform?.storage?.clearJson?.();
    await reloadStats();
  });
}

async function clearFiles() {
  $alert.yesno("options.storage.clear_files_confirm", async (btn) => {
    if (btn !== "yes") return;
    await Platform?.storage?.clearFiles?.();
    await reloadStats();
  });
}
</script>
