<template>
  <div class="opt">
    <!-- Geral -->
    <section class="opt-section">
      <h3 class="opt-section-title">{{ $t("options.general.title") }}</h3>

      <div class="opt-row">
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.fade_form"
            @change="setUd('fade_form', $event.target.checked)"
          />
          <span>{{ $t("options.general.fade_form") }}</span>
        </label>
      </div>

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
        <label class="opt-checkbox">
          <input
            type="checkbox"
            :checked="userdata.show_title_first_slide ?? true"
            @change="setUd('show_title_first_slide', $event.target.checked)"
          />
          <span>{{ $t("options.slides.show_title") }}</span>
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
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "vuetify";
import { useDisplays } from "@/composables/useDisplays";
import $appdata from "@/helpers/AppData";
import $userdata from "@/helpers/UserData";
import Platform from "@/helpers/Platform";

const isDesktop = computed(() => Platform.isDesktop);

const { locale } = useI18n();
const theme = useTheme();
const { displays, getPreferred, setPreferred, identify } = useDisplays();

const themes = [
  { id: "light", label: "Claro" },
  { id: "darkblue", label: "Claro - Azul" },
  { id: "blue", label: "Azul" },
  { id: "green", label: "Verde" },
  { id: "orange", label: "Laranja" },
  { id: "purple", label: "Roxo" },
  { id: "pink", label: "Rosa" },
  { id: "black", label: "Preto" },
  { id: "dark", label: "Escuro" },
];

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
  theme.global.name.value = selectedTheme;
  $userdata.set("theme", selectedTheme);
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
  // Sincroniza o estado real do SO com a preferência salva (caso o
  // usuário tenha alterado fora do app).
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
});
</script>

<style scoped>
.opt {
  font-family: var(--lj-font-shell);
  color: var(--lj-text);
  max-width: 720px;
}

.opt-section {
  margin-bottom: var(--lj-space-8);
}

.opt-section-title {
  font-size: var(--lj-text-lg);
  font-weight: var(--lj-weight-semibold);
  color: var(--lj-text);
  margin: 0 0 var(--lj-space-4);
  padding-bottom: var(--lj-space-2);
  border-bottom: 1px solid var(--lj-surface-border);
}

.opt-row {
  display: flex;
  align-items: center;
  gap: var(--lj-space-4);
  margin-bottom: var(--lj-space-3);
  font-size: var(--lj-text-base);
}

.opt-label {
  flex: 0 0 auto;
  min-width: 180px;
  color: var(--lj-text-muted);
  font-weight: var(--lj-weight-medium);
}

.opt-select {
  background: var(--lj-surface-bg);
  border: 1px solid var(--lj-surface-border-strong);
  border-radius: var(--lj-radius-sm);
  padding: var(--lj-space-2) var(--lj-space-3);
  font-size: var(--lj-text-base);
  font-family: inherit;
  color: var(--lj-text);
  cursor: pointer;
  outline: none;
  min-width: 220px;
}

.opt-select--inline {
  margin-left: var(--lj-space-3);
  min-width: 180px;
}

.opt-select:focus {
  border-color: var(--lj-navy);
  box-shadow: var(--lj-focus-ring);
}

.opt-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--lj-space-3);
  cursor: pointer;
  user-select: none;
}

.opt-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--lj-navy);
}

.opt-hint {
  margin: -8px 0 var(--lj-space-3) 28px;
  font-size: var(--lj-text-sm);
  color: var(--lj-text-muted);
  line-height: 1.4;
}

.opt-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--lj-space-2);
  background: var(--lj-surface-bg);
  border: 1px solid var(--lj-surface-border-strong);
  border-radius: var(--lj-radius-sm);
  padding: var(--lj-space-3) var(--lj-space-5);
  cursor: pointer;
  color: var(--lj-text);
  font-size: var(--lj-text-base);
  font-family: inherit;
  margin-top: var(--lj-space-3);
  transition: background var(--lj-transition-fast);
}

.opt-btn:hover {
  background: var(--lj-surface-bg-hover);
}

/* Monitores */
.opt-monitors {
  display: flex;
  gap: var(--lj-space-4);
  margin-bottom: var(--lj-space-3);
  flex-wrap: wrap;
}

.opt-monitor {
  flex: 0 0 auto;
  width: 140px;
  height: 90px;
  background: var(--lj-gray-800);
  border: 2px solid var(--lj-gray-300);
  border-radius: var(--lj-radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--lj-white);
  position: relative;
}

.opt-monitor--primary {
  border-color: var(--lj-orange);
}

.opt-monitor--primary::after {
  content: "★";
  position: absolute;
  top: 4px;
  right: 6px;
  color: var(--lj-orange);
  font-size: 14px;
}

.opt-monitor-num {
  font-size: 28px;
  font-weight: var(--lj-weight-bold);
  letter-spacing: 0.04em;
}

.opt-monitor-size {
  font-size: var(--lj-text-sm);
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.opt-empty {
  padding: var(--lj-space-5);
  background: var(--lj-surface-bg-soft);
  border: 1px dashed var(--lj-surface-border-strong);
  border-radius: var(--lj-radius-md);
  color: var(--lj-text-muted);
  font-size: var(--lj-text-base);
  text-align: center;
}
</style>
