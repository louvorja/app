import { ref, computed } from "vue";
import { playBeep } from "@helpers/AudioBeep";

/**
 * @param {import('vue').ComputedRef<Array>} items
 * @param {import('vue').ComputedRef<number>} totalDuration
 */
export function useLiturgyTimer(items, totalDuration) {
  const running = ref(false);
  const timerSeconds = ref(0);
  const timerCurrentIndex = ref(-1);
  const timerItemSeconds = ref(0);
  const timerItemTotal = ref(0);

  let _interval = null;

  const timerDisplay = computed(() => {
    const abs = Math.abs(timerSeconds.value);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    const sign = timerSeconds.value < 0 ? "-" : "";
    const pad = (n) => String(n).padStart(2, "0");
    if (h > 0) return `${sign}${h}:${pad(m)}:${pad(s)}`;
    return `${sign}${pad(m)}:${pad(s)}`;
  });

  const timerItemProgress = computed(() => {
    if (timerItemTotal.value <= 0) return 0;
    return Math.max(0, Math.min(100, (timerItemSeconds.value / timerItemTotal.value) * 100));
  });

  function _executableIndices() {
    return items.value
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.tipo !== "categoria")
      .map(({ idx }) => idx);
  }

  function _initItemTimer() {
    if (timerCurrentIndex.value < 0) return;
    const item = items.value[timerCurrentIndex.value];
    const dur = Number(item?.duration) || 0;
    timerItemTotal.value = dur > 0 ? dur * 60 : 60;
    timerItemSeconds.value = timerItemTotal.value;
  }

  function _advanceTimerItem(direction = 1) {
    const execs = _executableIndices();
    if (!execs.length) return;
    const pos = execs.indexOf(timerCurrentIndex.value);
    const nextPos = pos + direction;
    if (nextPos < 0 || nextPos >= execs.length) {
      if (direction > 0) timerCurrentIndex.value = -1;
      return;
    }
    playBeep(880, 0.3, 0.4);
    timerCurrentIndex.value = execs[nextPos];
    _initItemTimer();
  }

  function startTimer() {
    const total = totalDuration.value * 60;
    timerSeconds.value = total > 0 ? total : 30 * 60;
    running.value = true;

    const execs = _executableIndices();
    timerCurrentIndex.value = execs.length > 0 ? execs[0] : -1;
    _initItemTimer();

    _interval = setInterval(() => {
      timerSeconds.value--;
      if (timerCurrentIndex.value >= 0) {
        timerItemSeconds.value--;
        if (timerItemSeconds.value <= 0) {
          _advanceTimerItem();
        }
      }
    }, 1000);
  }

  function stopTimer() {
    running.value = false;
    clearInterval(_interval);
    _interval = null;
    timerSeconds.value = 0;
    timerCurrentIndex.value = -1;
    timerItemSeconds.value = 0;
    timerItemTotal.value = 0;
  }

  function toggleTimer() {
    if (running.value) stopTimer();
    else startTimer();
  }

  function timerNext() {
    _advanceTimerItem(1);
  }

  function timerPrev() {
    _advanceTimerItem(-1);
  }

  return {
    running,
    timerSeconds,
    timerCurrentIndex,
    timerItemSeconds,
    timerItemTotal,
    timerDisplay,
    timerItemProgress,
    toggleTimer,
    startTimer,
    stopTimer,
    timerNext,
    timerPrev,
  };
}
