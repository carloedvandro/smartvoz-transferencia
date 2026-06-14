// Tiny Web Audio synth sounds — no external assets needed.
let ctx: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Short coin/chime click — for tapping cards/buttons. */
export function playClick() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  [880, 1320].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, now + i * 0.04);
    g.gain.setValueAtTime(0.0001, now + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.04 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.18);
    o.connect(g).connect(ac.destination);
    o.start(now + i * 0.04);
    o.stop(now + i * 0.04 + 0.2);
  });
}

/** Celebratory chime — for success / Parabéns popup. */
export function playCelebrate() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(f, now + i * 0.09);
    g.gain.setValueAtTime(0.0001, now + i * 0.09);
    g.gain.exponentialRampToValueAtTime(0.22, now + i * 0.09 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.35);
    o.connect(g).connect(ac.destination);
    o.start(now + i * 0.09);
    o.stop(now + i * 0.09 + 0.4);
  });
}
