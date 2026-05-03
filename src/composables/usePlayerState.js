import { computed, getCurrentInstance } from "vue";
import Media from "@/composables/useMedia";
import { useAudioPlayback } from "@/composables/useAudioPlayback";

/**
 * usePlayerState — agrega estado reativo + ações do player de mídia.
 *
 * Estado: media (config), slides, has_instrumental_music, compact,
 * is_mobile, volume_icon, slide_text, menu_modes, mode, buttons.
 *
 * Áudio: re-exporta `useAudioPlayback()` (singleton: volume, currentTime,
 * duration, progress, isPaused, isFading, etc).
 *
 * Ações: play/pause/prev/next/first/last/rewind/forward/seekToProgress/
 * goToSlide/open/openLyric/maximize/close/fullscreen/toggleVolume/setVolume.
 */
export function usePlayerState() {
  const { proxy } = getCurrentInstance();
  const audio = useAudioPlayback();

  const media = computed(() => proxy.$modules.get("media"));
  const slides = computed(() => Media.slides());
  const has_instrumental_music = computed(() => !!media.value?.data?.url_instrumental_music);

  const compact = computed(() => proxy.$vuetify.display.width <= 500);
  const is_mobile = computed(() => proxy.$appdata.get("is_mobile"));

  const volume_icon = computed(() => {
    const v = audio.volume.value;
    if (v <= 0) return "mdi-volume-mute";
    if (v <= 20) return "mdi-volume-low";
    if (v <= 70) return "mdi-volume-medium";
    return "mdi-volume-high";
  });

  const slide_text = computed(() => {
    const idx = media.value?.config?.slide_index ?? 0;
    const item = slides.value?.[idx];
    if (!item?.lyric) return "";
    return String(item.lyric).replace(/<br>/gi, " / ").toUpperCase();
  });

  // Atalhos centralizados em Hotkeys.js (Space, Home, End, Ctrl+↑/↓/PageUp/PageDown).
  // ArrowLeft/ArrowRight permanecem locais — não estão no Hotkeys.js para não conflitar
  // com a navegação de listas.
  const buttons = computed(() => {
    const cfg = media.value?.config ?? {};
    const lastSlide = cfg.last_slide ?? 0;
    const slideIndex = cfg.slide_index ?? 0;
    const hasAudio = !!cfg.audio;
    return [
      {
        show: hasAudio,
        compact: true,
        disabled: false,
        highlight: false,
        icon: "mdi-rewind-10",
        click: () => rewind(),
      },
      {
        show: true,
        compact: true,
        disabled: slideIndex <= 0,
        highlight: false,
        icon: "mdi-page-first",
        click: () => first(),
      },
      {
        show: true,
        compact: false,
        disabled: slideIndex <= 0,
        highlight: false,
        icon: "mdi-chevron-left",
        click: () => prev(),
        shortkey: ["arrowleft"],
      },
      {
        show: hasAudio,
        compact: false,
        disabled: audio.isFading.value,
        highlight: true,
        icon: audio.isPaused.value ? "mdi-play" : "mdi-pause",
        click: () => playToggle(),
      },
      {
        show: true,
        compact: false,
        disabled: slideIndex >= lastSlide - 1,
        highlight: false,
        icon: "mdi-chevron-right",
        click: () => next(),
        shortkey: ["arrowright"],
      },
      {
        show: true,
        compact: true,
        disabled: slideIndex >= lastSlide - 1,
        highlight: false,
        icon: "mdi-page-last",
        click: () => last(),
      },
      {
        show: hasAudio,
        compact: true,
        disabled: false,
        highlight: false,
        icon: "mdi-fast-forward-10",
        click: () => forward(),
      },
    ];
  });

  const menu_modes = computed(() => {
    const t = proxy.$t;
    const cfg = media.value?.config ?? {};
    const idMusic = media.value?.id_music;
    const minimized = media.value?.minimized;
    return [
      {
        mode: "audio",
        title: t("modules.media.general.sung"),
        color: "info",
        active: cfg.mode === "audio",
        icon: "mdi-play-box-multiple",
        tray_icon: "mdi-account-voice",
        click: () => open({ id_music: idMusic, mode: "audio", minimized }),
      },
      {
        mode: "instrumental",
        title: t("modules.media.general.instrumental"),
        color: "success",
        active: cfg.mode === "instrumental",
        disabled: !has_instrumental_music.value,
        icon: "mdi-play-box-multiple-outline",
        tray_icon: "mdi-music-note",
        click: () => open({ id_music: idMusic, mode: "instrumental", minimized }),
      },
      {
        mode: "no_audio",
        title: t("modules.media.general.no_audio"),
        color: "error",
        active: cfg.mode === "no_audio",
        icon: "mdi-checkbox-multiple-blank-outline",
        tray_icon: "mdi-music-off",
        click: () => open({ id_music: idMusic, minimized }),
      },
      { title: "-" },
      {
        title: t("modules.media.general.lyric"),
        color: "error",
        icon: "mdi-text-box-outline",
        click: () => openLyric(),
      },
    ];
  });

  const mode = computed(
    () =>
      menu_modes.value.find((item) => item.mode === media.value?.config?.mode) ??
      menu_modes.value[0]
  );

  // ações
  function playToggle() {
    if (audio.isPaused.value) Media.play();
    else Media.pause();
  }
  function rewind() {
    Media.advanceTime(-10);
  }
  function forward() {
    Media.advanceTime(+10);
  }
  function first() {
    Media.firstSlide();
  }
  function prev() {
    Media.prevSlide();
  }
  function next() {
    Media.nextSlide();
  }
  function last() {
    Media.lastSlide();
  }
  function open(data) {
    Media.open(data);
  }
  function openLyric() {
    Media.openLyric();
  }
  function maximize() {
    Media.maximize();
  }
  function close() {
    Media.close();
  }
  function fullscreen(value = true) {
    Media.fullscreen(value);
  }
  function toggleVolume() {
    Media.toogleVolume();
  }
  function setVolume(value) {
    Media.setVolume(value ?? audio.volume.value);
  }
  function seekToProgress() {
    const time = (audio.duration.value * audio.progress.value) / 100;
    Media.goToTime(time);
  }
  function goToSlide(index) {
    Media.goToSlide(index);
  }

  return {
    audio,
    media,
    slides,
    has_instrumental_music,
    compact,
    is_mobile,
    volume_icon,
    slide_text,
    buttons,
    menu_modes,
    mode,
    playToggle,
    rewind,
    forward,
    first,
    prev,
    next,
    last,
    open,
    openLyric,
    maximize,
    close,
    fullscreen,
    toggleVolume,
    setVolume,
    seekToProgress,
    goToSlide,
  };
}
