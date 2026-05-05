/** @category helper-puro — Toca beeps via Web Audio API. Sem APIs Vue; sem acesso ao store. */
let _ctx = null;

function getContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

/**
 * Toca um bipe via Web Audio API.
 * @param {number} frequency   Hz (padrão 880)
 * @param {number} duration    segundos (padrão 0.2)
 * @param {number} volume      0–1 (padrão 0.5)
 * @param {number} delaySeconds início relativo ao currentTime (padrão 0)
 */
export function playBeep(frequency = 880, duration = 0.2, volume = 0.5, delaySeconds = 0) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const startAt = ctx.currentTime + delaySeconds;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.start(startAt);
  osc.stop(startAt + duration);
}
