import { ref, getCurrentScope, onScopeDispose, type Ref } from "vue";

type TimeCallback = (currentTime: number, duration: number) => void;

export interface AudioPlayback {
  volume: Ref<number>;
  currentTime: Ref<number>;
  duration: Ref<number>;
  progress: Ref<number>;
  buffered: Ref<number>;
  isPaused: Ref<boolean>;
  isFading: Ref<boolean>;
  getElement: () => HTMLAudioElement;
  setSrc: (src: string, lazy?: boolean) => void;
  setDurationHint: (seconds: number) => void;
  play: (onError?: (e: unknown) => void) => void;
  pause: (callback?: () => void) => void;
  stop: (callback?: () => void) => void;
  setVolume: (val: number) => void;
  toggleVolume: () => void;
  seekTo: (time: number) => void;
  advanceTime: (delta: number) => void;
  fadeIn: (maxVolume: number, callback?: () => void) => void;
  fadeOut: (callback?: () => void) => void;
  onTimeUpdate: (cb: TimeCallback) => () => void;
  reset: () => void;
  cleanup: () => void;
}

let _shared: AudioPlayback | null = null;

function _create(): AudioPlayback {
  const volume      = ref(100);
  const currentTime = ref(0);
  const duration    = ref(0);
  const progress    = ref(0);
  const buffered    = ref(0);
  const isPaused    = ref(true);
  const isFading    = ref(false);
  const isLazy      = ref(false);

  let _el: HTMLAudioElement | null = null;
  let _rafId: number | null = null;
  let _playing = false;
  const _timeCallbacks: TimeCallback[] = [];

  function _syncTime(): void {
    if (!_el) return;
    const ct = isNaN(_el.currentTime) ? 0 : _el.currentTime;
    const d =
      isNaN(_el.duration) || !isFinite(_el.duration) ? duration.value : _el.duration;
    currentTime.value = ct;
    duration.value    = d;
    progress.value    = d <= 0 ? 0 : (ct / d) * 100;
    if (!isLazy.value) {
      buffered.value = 100;
    } else {
      const b = _el.buffered;
      buffered.value = b.length > 0 ? (b.end(0) / _el.duration) * 100 : 0;
    }
    for (const cb of _timeCallbacks) cb(ct, d);
  }

  function _startRaf(): void {
    if (_rafId) return;
    const tick = () => {
      if (!_playing) {
        _rafId = null;
        return;
      }
      _syncTime();
      _rafId = requestAnimationFrame(tick);
    };
    _rafId = requestAnimationFrame(tick);
  }

  function _stopRaf(): void {
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
    _playing = false;
  }

  function getElement(): HTMLAudioElement {
    if (!_el) {
      _el = document.getElementById("__audio") as HTMLAudioElement | null;
      if (!_el) {
        _el = document.createElement("audio");
        _el.id = "__audio";
        _el.preload = "auto";
        document.body.appendChild(_el);
      }
      _el.addEventListener("timeupdate", _syncTime);
      _el.addEventListener("progress", _syncTime);
    }
    _el.autoplay = true;
    return _el;
  }

  function setSrc(src: string, lazy = false): void {
    const el = getElement();
    isLazy.value = lazy;
    el.src = src;
    el.load();
  }

  function setDurationHint(seconds: number): void {
    if (!duration.value) duration.value = seconds;
  }

  function play(onError?: (e: unknown) => void): void {
    const el = getElement();
    el
      .play()
      .then(() => {
        _playing = true;
        isPaused.value = false;
        _startRaf();
      })
      .catch((e) => {
        if (onError) onError(e);
      });
  }

  function pause(callback?: () => void): void {
    _stopRaf();
    const el = getElement();
    el.pause();
    isPaused.value = true;
    if (callback) callback();
  }

  function stop(callback?: () => void): void {
    _stopRaf();
    if (_el) {
      _el.pause();
      _el.src = "";
    }
    isPaused.value = true;
    if (callback) callback();
  }

  function setVolume(val: number): void {
    volume.value = val;
    if (_el) _el.volume = val / 100;
  }

  function toggleVolume(): void {
    setVolume(volume.value < 100 ? 100 : 0);
  }

  function seekTo(time: number): void {
    const el = getElement();
    const d  = duration.value;
    el.currentTime = Math.max(0, Math.min(time ?? 0, d));
  }

  function advanceTime(delta: number): void {
    seekTo(currentTime.value + delta);
  }

  // Fade rápido para UX: ~200ms total. Antes era ~1200ms (0.05 a cada 60ms),
  // perceptivelmente lento ao trocar/fechar/pausar música. Agora 0.1 a cada
  // 20ms = 10 ticks ≈ 200ms — suave o suficiente pra não cortar abruptamente
  // o áudio, rápido o suficiente pra não atrasar o usuário.
  const _FADE_STEP = 0.1;
  const _FADE_INTERVAL_MS = 20;

  function fadeIn(maxVolume: number, callback?: () => void): void {
    isFading.value = true;
    const target = maxVolume / 100;
    const el = getElement();
    const id = setInterval(() => {
      if (el.volume < target) {
        el.volume = Math.min(el.volume + _FADE_STEP, target);
      } else {
        isFading.value = false;
        clearInterval(id);
        if (callback) callback();
      }
    }, _FADE_INTERVAL_MS);
  }

  function fadeOut(callback?: () => void): void {
    const el = getElement();
    if (el.paused) {
      if (callback) callback();
      return;
    }
    isFading.value = true;
    const id = setInterval(() => {
      if (el.volume > 0) {
        el.volume = Math.max(el.volume - _FADE_STEP, 0);
      } else {
        isFading.value = false;
        clearInterval(id);
        if (callback) callback();
      }
    }, _FADE_INTERVAL_MS);
  }

  function onTimeUpdate(cb: TimeCallback): () => void {
    _timeCallbacks.push(cb);
    return () => {
      const i = _timeCallbacks.indexOf(cb);
      if (i >= 0) _timeCallbacks.splice(i, 1);
    };
  }

  function reset(): void {
    volume.value      = 100;
    currentTime.value = 0;
    duration.value    = 0;
    progress.value    = 0;
    buffered.value    = 0;
    isPaused.value    = true;
    isFading.value    = false;
    isLazy.value      = false;
  }

  function cleanup(): void {
    _stopRaf();
    if (_el) {
      _el.removeEventListener("timeupdate", _syncTime);
      _el.removeEventListener("progress", _syncTime);
      if (_el.parentNode) _el.parentNode.removeChild(_el);
      _el = null;
    }
  }

  return {
    volume, currentTime, duration, progress, buffered, isPaused, isFading,
    getElement, setSrc, setDurationHint,
    play, pause, stop,
    setVolume, toggleVolume, seekTo, advanceTime,
    fadeIn, fadeOut, onTimeUpdate,
    reset, cleanup,
  };
}

export function useAudioPlayback(): AudioPlayback {
  if (!_shared) _shared = _create();
  if (getCurrentScope()) {
    onScopeDispose(() => {
      // não destrói o singleton — só remove referências locais se necessário
    });
  }
  return _shared;
}
