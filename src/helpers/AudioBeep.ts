/** @category helper-puro — Toca beeps via Web Audio API. Sem APIs Vue; sem acesso ao store. */

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let _ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext!)();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

export function playBeep(
  frequency = 880,
  duration = 0.2,
  volume = 0.5,
  delaySeconds = 0,
): void {
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
