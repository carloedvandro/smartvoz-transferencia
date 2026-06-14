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

/** Soft coin/icon tap — for sub-icons (levels, network, etc). */
export function playTap() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(1760, now);
  o.frequency.exponentialRampToValueAtTime(660, now + 0.18);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  o.connect(g).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.25);
}

/** Piggy rattle → ceramic smash → cascade of coin clinks. */
export function playPiggyPop() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // 1) Rattle/shake (coins jingling inside) — short metallic ticks 0→0.85s
  for (let i = 0; i < 10; i++) {
    const t = now + i * 0.08 + Math.random() * 0.02;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(1800 + Math.random() * 900, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + 0.1);
  }

  // 2) Ceramic SMASH at 0.9s — noise burst + low thud
  const popTime = now + 0.9;
  const thud = ac.createOscillator();
  const tg = ac.createGain();
  thud.type = "square";
  thud.frequency.setValueAtTime(140, popTime);
  thud.frequency.exponentialRampToValueAtTime(35, popTime + 0.18);
  tg.gain.setValueAtTime(0.0001, popTime);
  tg.gain.exponentialRampToValueAtTime(0.5, popTime + 0.005);
  tg.gain.exponentialRampToValueAtTime(0.0001, popTime + 0.25);
  thud.connect(tg).connect(ac.destination);
  thud.start(popTime);
  thud.stop(popTime + 0.3);

  // Bright shatter noise (ceramic shards)
  const burstLen = 0.45;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * burstLen), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.4);
  }
  const noise = ac.createBufferSource();
  const ng = ac.createGain();
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  noise.buffer = buf;
  ng.gain.setValueAtTime(0.5, popTime);
  ng.gain.exponentialRampToValueAtTime(0.0001, popTime + burstLen);
  noise.connect(hp).connect(ng).connect(ac.destination);
  noise.start(popTime);

  // 3) Cascade of coin clinks (gold coins hitting surface) 1.0s → 2.6s
  const cascadeStart = now + 1.0;
  for (let i = 0; i < 24; i++) {
    const t = cascadeStart + i * 0.065 + Math.random() * 0.04;
    const freqs = [2200, 2640, 3140, 3520, 2960, 2480, 1980];
    const f = freqs[i % freqs.length] + (Math.random() - 0.5) * 200;
    // Two-tone clink: high ping + harmonic
    [f, f * 1.5].forEach((freq, k) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = k === 0 ? "triangle" : "sine";
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.18);
      const peak = k === 0 ? 0.14 : 0.06;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.25);
    });
  }
}


/** Celebratory chime — for success / Parabéns popup. */
export function playCelebrate() {
  playPiggyPop();
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime + 0.1;
  const notes = [523.25, 659.25, 783.99, 1046.5];
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

/** Arpeggio of notes — building block for category sounds. */
function playArpeggio(notes: number[], opts: { type?: OscillatorType; step?: number; gain?: number } = {}) {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const step = opts.step ?? 0.08;
  const type = opts.type ?? "triangle";
  const gain = opts.gain ?? 0.2;
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now + i * step);
    g.gain.setValueAtTime(0.0001, now + i * step);
    g.gain.exponentialRampToValueAtTime(gain, now + i * step + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * step + 0.3);
    o.connect(g).connect(ac.destination);
    o.start(now + i * step);
    o.stop(now + i * step + 0.35);
  });
}

/** Plays a unique sound for each transaction category. */
export function playCategorySound(categoria: string) {
  switch (categoria) {
    case "Carteira":
      playArpeggio([784, 988, 1175, 1568], { type: "sine" });
      break;
    case "Comissão":
      // Coin-drop cascade
      playArpeggio([1568, 1318, 1046, 1318, 1568, 1975], { type: "triangle", step: 0.06 });
      break;
    case "Parceria":
      // Warm chord
      playArpeggio([523, 659, 784, 1046], { type: "sine", step: 0.05 });
      break;
    case "Níveis":
      // Level-up jingle
      playArpeggio([659, 784, 988, 1318, 1568, 1975], { type: "square", step: 0.07, gain: 0.15 });
      break;
    case "Rede":
      playArpeggio([440, 587, 740, 988, 1175], { type: "triangle", step: 0.07 });
      break;
    case "Transferência":
    case "Transferência de saldo":
      playArpeggio([880, 1046, 1318, 1046, 880], { type: "sine", step: 0.06 });
      break;
    case "Saque":
    case "Solicitação de saque":
      playCelebrate();
      break;
    default:
      playTap();
  }
}
