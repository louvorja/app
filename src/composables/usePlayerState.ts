import { computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import Media from "@/composables/useMedia";
import { useAudioPlayback } from "@/composables/useAudioPlayback";
import type { AudioPlayback } from "@/composables/useAudioPlayback";
import Modules from "@/helpers/Modules";
import AppData from "@/helpers/AppData";

export interface PlayerButton {
  show: boolean;
  compact: boolean;
  disabled: boolean;
  highlight: boolean;
  icon: string;
  click: () => void;
}

export interface MenuMode {
  mode?: string;
  title: string;
  color?: string;
  active?: boolean;
  icon?: string;
  tray_icon?: string;
  disabled?: boolean;
  click?: () => void;
}

export interface Slide {
  lyric?: string;
  cover?: boolean;
  time?: string;
  url_image?: string;
  [key: string]: unknown;
}

/**
 * usePlayerState — agrega estado reativo + ações do player de mídia.
 *
 * Estado: media (config), slides, has_instrumental_music, compact,
 * is_mobile, volume_icon, slide_text, menu_modes, mode, buttons.
 *
 * Áudio: re-exporta `useAudioPlayback()` (singleton: volume, currentTime,
 * duration, progress, isPaused, isFading, etc).
 */
export function usePlayerState(): {
  audio: AudioPlayback;
  media: ComputedRef<Record<string, unknown>>;
  slides: ComputedRef<Slide[]>;
  has_instrumental_music: ComputedRef<boolean>;
  compact: ComputedRef<boolean>;
  is_mobile: ComputedRef<unknown>;
  volume_icon: ComputedRef<string>;
  slide_text: ComputedRef<string>;
  buttons: ComputedRef<PlayerButton[]>;
  menu_modes: ComputedRef<MenuMode[]>;
  mode: ComputedRef<MenuMode>;
  playToggle: () => void;
  rewind: () => void;
  forward: () => void;
  first: () => void;
  prev: () => void;
  next: () => void;
  last: () => void;
  open: (data: unknown) => void;
  openLyric: () => void;
  maximize: () => void;
  close: () => void;
  fullscreen: (value?: boolean) => void;
  toggleVolume: () => void;
  setVolume: (value?: number) => void;
  seekToProgress: () => void;
  goToSlide: (index: number) => void;
} {
  const { t }     = useI18n();
  const { width } = useDisplay();
  const audio     = useAudioPlayback();

  const media   = computed<Record<string, unknown>>(() => Modules.get("media") as Record<string, unknown>);
  const slides  = computed<Slide[]>(() => Media.slides() as Slide[]);
  const has_instrumental_music = computed<boolean>(
    () => !!(media.value?.data as Record<string, unknown>)?.url_instrumental_music
  );

  const compact   = computed<boolean>(() => width.value <= 500);
  const is_mobile = computed(() => AppData.get("is_mobile"));

  const volume_icon = computed<string>(() => {
    const v = audio.volume.value;
    if (v <= 0)  return "mdi-volume-mute";
    if (v <= 20) return "mdi-volume-low";
    if (v <= 70) return "mdi-volume-medium";
    return "mdi-volume-high";
  });

  const slide_text = computed<string>(() => {
    const cfg   = media.value?.config as Record<string, unknown> | undefined;
    const idx   = (cfg?.slide_index as number) ?? 0;
    const item  = slides.value?.[idx];
    if (!item?.lyric) return "";
    return String(item.lyric).replace(/<br>/gi, " / ").toUpperCase();
  });

  const buttons = computed<PlayerButton[]>(() => {
    const cfg        = (media.value?.config as Record<string, unknown>) ?? {};
    const lastSlide  = (cfg.last_slide as number) ?? 0;
    const slideIndex = (cfg.slide_index as number) ?? 0;
    const hasAudio   = !!(cfg.audio);
    return [
      {
        show: hasAudio, compact: true,  disabled: false,
        highlight: false, icon: "mdi-rewind-10",
        click: () => rewind(),
      },
      {
        show: true, compact: true, disabled: slideIndex <= 0,
        highlight: false, icon: "mdi-page-first",
        click: () => first(),
      },
      {
        show: true, compact: false, disabled: slideIndex <= 0,
        highlight: false, icon: "mdi-chevron-left",
        click: () => prev(),
      },
      {
        show: hasAudio, compact: false, disabled: audio.isFading.value,
        highlight: true, icon: audio.isPaused.value ? "mdi-play" : "mdi-pause",
        click: () => playToggle(),
      },
      {
        show: true, compact: false, disabled: slideIndex >= lastSlide - 1,
        highlight: false, icon: "mdi-chevron-right",
        click: () => next(),
      },
      {
        show: true, compact: true, disabled: slideIndex >= lastSlide - 1,
        highlight: false, icon: "mdi-page-last",
        click: () => last(),
      },
      {
        show: hasAudio, compact: true, disabled: false,
        highlight: false, icon: "mdi-fast-forward-10",
        click: () => forward(),
      },
    ];
  });

  const menu_modes = computed<MenuMode[]>(() => {
    const cfg       = (media.value?.config as Record<string, unknown>) ?? {};
    const idMusic   = media.value?.id_music;
    const minimized = media.value?.minimized as boolean | undefined;
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

  const mode = computed<MenuMode>(
    () =>
      menu_modes.value.find((item) => item.mode === (media.value?.config as Record<string, unknown>)?.mode) ??
      menu_modes.value[0]
  );

  function playToggle():    void { if (audio.isPaused.value) Media.play(); else Media.pause(); }
  function rewind():        void { Media.advanceTime(-10); }
  function forward():       void { Media.advanceTime(+10); }
  function first():         void { Media.firstSlide(); }
  function prev():          void { Media.prevSlide(); }
  function next():          void { Media.nextSlide(); }
  function last():          void { Media.lastSlide(); }
  function open(data: unknown): void { Media.open(data as Parameters<typeof Media.open>[0]); }
  function openLyric():     void { Media.openLyric(); }
  function maximize():      void { Media.maximize(); }
  function close():         void { Media.close(); }
  function fullscreen(value = true): void { Media.fullscreen(value); }
  function toggleVolume():  void { Media.toogleVolume(); }
  function setVolume(value?: number): void {
    Media.setVolume(value ?? audio.volume.value);
  }
  function seekToProgress(): void {
    const time = (audio.duration.value * audio.progress.value) / 100;
    Media.goToTime(time);
  }
  function goToSlide(index: number): void { Media.goToSlide(index); }

  return {
    audio, media, slides, has_instrumental_music, compact, is_mobile,
    volume_icon, slide_text, buttons, menu_modes, mode,
    playToggle, rewind, forward, first, prev, next, last,
    open, openLyric, maximize, close, fullscreen, toggleVolume, setVolume,
    seekToProgress, goToSlide,
  };
}
