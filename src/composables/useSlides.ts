import { ref, computed, watch, toRaw, type Ref, type ComputedRef } from "vue";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";
import type { AudioPlayback } from "@/composables/useAudioPlayback";

export interface Slide {
  lyric?: string;
  cover?: boolean;
  time?: string;
  instrumental_time?: string;
  url_image?: string;
  image_position?: string | number;
  [key: string]: unknown;
}

interface SlidesInstance {
  slides: Ref<Slide[]>;
  slideIndex: Ref<number>;
  slideProgress: Ref<number>;
  title: Ref<string>;
  slide: ComputedRef<Slide | null>;
  nextSlide: ComputedRef<Slide | null>;
  totalSlides: ComputedRef<number>;
  setSlides: (newSlides: Slide[], newTimes: number[], newTitle: string) => void;
  bindAudio: (audioPlayback: AudioPlayback) => void;
  unbindAudio: () => void;
  broadcastSlide: () => void;
  goToSlide: (index: number) => void;
  goPrev: () => void;
  goNext: () => void;
  goFirst: () => void;
  goLast: () => void;
  reset: () => void;
}

let _shared: SlidesInstance | null = null;

function _create(): SlidesInstance {
  const slides        = ref<Slide[]>([]);
  const slideIndex    = ref(0);
  const times         = ref<number[]>([]);
  const slideProgress = ref(0);
  const title         = ref("");

  let _lastBroadcastIndex = -1;
  let _stopAudioWatch: (() => void) | null = null;
  let _audio: AudioPlayback | null = null;

  const slide      = computed<Slide | null>(() => slides.value[slideIndex.value] ?? null);
  const nextSlide  = computed<Slide | null>(() => slides.value[slideIndex.value + 1] ?? null);
  const totalSlides = computed<number>(() => slides.value.length);

  // Listener de GO_TO_SLIDE vindo do Operator ou outras janelas
  $broadcast.listen((msg) => {
    if (msg.type === BROADCAST_TYPE.GO_TO_SLIDE) {
      goToSlide((msg.payload as { index: number }).index);
    }
  });

  function setSlides(newSlides: Slide[], newTimes: number[], newTitle: string): void {
    slides.value        = newSlides ?? [];
    times.value         = newTimes ?? [];
    title.value         = newTitle ?? "";
    slideIndex.value    = 0;
    slideProgress.value = 0;
    _lastBroadcastIndex = -1;
  }

  function broadcastSlide(): void {
    const idx = slideIndex.value;
    $broadcast.send(BROADCAST_TYPE.SLIDE_CHANGE, {
      slide_index:  idx,
      slide:        toRaw(slide.value),
      next_slide:   toRaw(nextSlide.value),
      title:        title.value,
      progress:     _audio?.progress.value ?? 0,
      total_slides: totalSlides.value,
    });
  }

  function goToSlide(index: number): void {
    const last = totalSlides.value - 1;
    const idx  = Math.max(0, Math.min(Math.floor(index ?? 0), last < 0 ? 0 : last));

    // Com áudio e timestamps: seek no áudio → slideIndex atualiza via watcher reativo
    if (_audio && _audio.duration.value > 0 && times.value.length > 0) {
      _audio.seekTo(times.value[idx] ?? 0);
    } else {
      slideIndex.value = idx;
      broadcastSlide();
    }
  }

  function goPrev(): void  { goToSlide(slideIndex.value - 1); }
  function goNext(): void  { goToSlide(slideIndex.value + 1); }
  function goFirst(): void { goToSlide(0); }
  function goLast(): void  { goToSlide(totalSlides.value - 1); }

  // Vincula ao useAudioPlayback: watch reativo em currentTime substitui RAF/setInterval
  function bindAudio(audioPlayback: AudioPlayback): void {
    _audio = audioPlayback;
    if (_stopAudioWatch) {
      _stopAudioWatch();
      _stopAudioWatch = null;
    }
    _stopAudioWatch = watch(
      () => audioPlayback.currentTime.value,
      (ct) => {
        const ts = times.value;
        const d  = audioPlayback.duration.value;
        if (!ts?.length) return;

        const si    = Math.max(0, ts.filter((t) => t <= ct).length - 1);
        const start = ts[si] ?? 0;
        const end   = ts[si + 1] ?? d;
        const sp    = end > start ? ((ct - start) / (end - start)) * 100 : 0;

        slideProgress.value = sp;
        slideIndex.value    = si;

        if (si !== _lastBroadcastIndex) {
          _lastBroadcastIndex = si;
          broadcastSlide();
        }
      }
    );
  }

  function unbindAudio(): void {
    if (_stopAudioWatch) {
      _stopAudioWatch();
      _stopAudioWatch = null;
    }
    _audio = null;
  }

  function reset(): void {
    unbindAudio();
    slides.value        = [];
    slideIndex.value    = 0;
    times.value         = [];
    slideProgress.value = 0;
    title.value         = "";
    _lastBroadcastIndex = -1;
  }

  return {
    slides, slideIndex, slideProgress, title,
    slide, nextSlide, totalSlides,
    setSlides, bindAudio, unbindAudio, broadcastSlide,
    goToSlide, goPrev, goNext, goFirst, goLast, reset,
  };
}

export function useSlides(): SlidesInstance {
  if (!_shared) _shared = _create();
  return _shared;
}
