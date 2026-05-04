import { ref, computed, watch, toRaw } from "vue";
import $broadcast, { BROADCAST_TYPE } from "@/helpers/Broadcast";

let _shared = null;

function _create() {
  const slides = ref([]);
  const slideIndex = ref(0);
  const times = ref([]);
  const slideProgress = ref(0);
  const title = ref("");

  let _lastBroadcastIndex = -1;
  let _stopAudioWatch = null;
  let _audio = null;

  const slide = computed(() => slides.value[slideIndex.value] ?? null);
  const nextSlide = computed(() => slides.value[slideIndex.value + 1] ?? null);
  const totalSlides = computed(() => slides.value.length);

  // Listener de GO_TO_SLIDE vindo do Operator ou outras janelas
  $broadcast.listen((msg) => {
    if (msg.type === BROADCAST_TYPE.GO_TO_SLIDE) {
      goToSlide(msg.payload.index);
    }
  });

  function setSlides(newSlides, newTimes, newTitle) {
    slides.value = newSlides ?? [];
    times.value = newTimes ?? [];
    title.value = newTitle ?? "";
    slideIndex.value = 0;
    slideProgress.value = 0;
    _lastBroadcastIndex = -1;
  }

  function broadcastSlide() {
    const idx = slideIndex.value;
    $broadcast.send(BROADCAST_TYPE.SLIDE_CHANGE, {
      slide_index: idx,
      slide: toRaw(slide.value),
      next_slide: toRaw(nextSlide.value),
      title: title.value,
      progress: _audio?.progress.value ?? 0,
      total_slides: totalSlides.value,
    });
  }

  function goToSlide(index) {
    const last = totalSlides.value - 1;
    const idx = Math.max(0, Math.min(Math.floor(index ?? 0), last < 0 ? 0 : last));

    // Com áudio e timestamps: seek no áudio → slideIndex atualiza via watcher reativo
    if (_audio && _audio.duration.value > 0 && times.value.length > 0) {
      _audio.seekTo(times.value[idx] ?? 0);
    } else {
      slideIndex.value = idx;
      broadcastSlide();
    }
  }

  function goPrev() {
    goToSlide(slideIndex.value - 1);
  }

  function goNext() {
    goToSlide(slideIndex.value + 1);
  }

  function goFirst() {
    goToSlide(0);
  }

  function goLast() {
    goToSlide(totalSlides.value - 1);
  }

  // Vincula ao useAudioPlayback: watch reativo em currentTime substitui RAF/setInterval
  function bindAudio(audioPlayback) {
    _audio = audioPlayback;
    if (_stopAudioWatch) {
      _stopAudioWatch();
      _stopAudioWatch = null;
    }
    _stopAudioWatch = watch(
      () => audioPlayback.currentTime.value,
      (ct) => {
        const ts = times.value;
        const d = audioPlayback.duration.value;
        if (!ts?.length) return;

        const si = Math.max(0, ts.filter((t) => t <= ct).length - 1);
        const start = ts[si] ?? 0;
        const end = ts[si + 1] ?? d;
        const sp = end > start ? ((ct - start) / (end - start)) * 100 : 0;

        slideProgress.value = sp;
        slideIndex.value = si;

        if (si !== _lastBroadcastIndex) {
          _lastBroadcastIndex = si;
          broadcastSlide();
        }
      }
    );
  }

  function unbindAudio() {
    if (_stopAudioWatch) {
      _stopAudioWatch();
      _stopAudioWatch = null;
    }
    _audio = null;
  }

  function reset() {
    unbindAudio();
    slides.value = [];
    slideIndex.value = 0;
    times.value = [];
    slideProgress.value = 0;
    title.value = "";
    _lastBroadcastIndex = -1;
  }

  return {
    slides,
    slideIndex,
    slideProgress,
    title,
    slide,
    nextSlide,
    totalSlides,
    setSlides,
    bindAudio,
    unbindAudio,
    broadcastSlide,
    goToSlide,
    goPrev,
    goNext,
    goFirst,
    goLast,
    reset,
  };
}

export function useSlides() {
  if (!_shared) _shared = _create();
  return _shared;
}
