// WebAudio chiptune sfx — oscillators only, no asset files. DOM module.
let actx = null;
let muted = false;

function ctx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}

// Browsers block audio until a user gesture: resume on first keydown.
export function initAudio() {
  const resume = () => {
    ctx().resume();
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('keydown', resume);
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

// One note. when/dur in seconds; slide = optional end frequency (pitch ramp).
function tone(freq, when, dur, type = 'square', vol = 0.06, slide = 0) {
  const a = ctx();
  const t = a.currentTime + when;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.linearRampToValueAtTime(slide, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SFX = {
  jump:       () => tone(240, 0, 0.15, 'square', 0.05, 520),
  manna:      () => { tone(988, 0, 0.07); tone(1319, 0.07, 0.12); },
  scroll:     () => { tone(523, 0, 0.09); tone(659, 0.09, 0.09); tone(784, 0.18, 0.18); },
  stomp:      () => tone(220, 0, 0.12, 'square', 0.07, 70),
  hurt:       () => tone(180, 0, 0.25, 'sawtooth', 0.06, 60),
  throwStone: () => tone(700, 0, 0.06, 'square', 0.04, 400),
  bump:       () => tone(110, 0, 0.08, 'triangle', 0.08),
  powerup:    () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.1)); },
  checkpoint: () => { tone(660, 0, 0.1); tone(880, 0.1, 0.2); },
  clear:      () => { [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone(f, i * 0.1, 0.12)); },
  bossHit:    () => tone(140, 0, 0.15, 'square', 0.08, 80),
  clank:      () => tone(900, 0, 0.05, 'triangle', 0.05, 700),
  bossDown:   () => { [880, 784, 659, 587, 523, 392].forEach((f, i) => tone(f, i * 0.09, 0.12)); },
  gameOver:   () => { [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.25, 0.3, 'triangle')); },
  victory:    () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.15)); },
};

export function sfx(name) {
  if (muted) return;
  const fn = SFX[name];
  if (fn) {
    try { fn(); } catch (_) { /* audio unavailable — never crash the game */ }
  }
}
