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

/** Whistle + balloon-pop + sparkle for the piggy explosion. */
export function playPiggyPop() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // 1) Rising whistle (0 → 0.45s)
  const w = ac.createOscillator();
  const wg = ac.createGain();
  w.type = "sine";
  w.frequency.setValueAtTime(600, now);
  w.frequency.exponentialRampToValueAtTime(2400, now + 0.45);
  wg.gain.setValueAtTime(0.0001, now);
  wg.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  w.connect(wg).connect(ac.destination);
  w.start(now);
  w.stop(now + 0.55);

  // 2) Balloon pop at 0.5s (short noise burst via square + fast envelope)
  const popTime = now + 0.5;
  const pop = ac.createOscillator();
  const pg = ac.createGain();
  pop.type = "square";
  pop.frequency.setValueAtTime(180, popTime);
  pop.frequency.exponentialRampToValueAtTime(40, popTime + 0.08);
  pg.gain.setValueAtTime(0.0001, popTime);
  pg.gain.exponentialRampToValueAtTime(0.4, popTime + 0.005);
  pg.gain.exponentialRampToValueAtTime(0.0001, popTime + 0.12);
  pop.connect(pg).connect(ac.destination);
  pop.start(popTime);
  pop.stop(popTime + 0.15);

  // 3) Noise burst overlay
  const burstLen = 0.18;
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * burstLen), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const noise = ac.createBufferSource();
  const ng = ac.createGain();
  noise.buffer = buf;
  ng.gain.setValueAtTime(0.35, popTime);
  ng.gain.exponentialRampToValueAtTime(0.0001, popTime + burstLen);
  noise.connect(ng).connect(ac.destination);
  noise.start(popTime);

  // 4) Sparkle arpeggio (cash-rain feeling) 0.55 → 1.6s
  const sparkleStart = now + 0.55;
  const notes = [1046.5, 1318.5, 1568, 1975.5, 2349, 1568, 1975.5, 2637];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(f, sparkleStart + i * 0.11);
    g.gain.setValueAtTime(0.0001, sparkleStart + i * 0.11);
    g.gain.exponentialRampToValueAtTime(0.16, sparkleStart + i * 0.11 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, sparkleStart + i * 0.11 + 0.28);
    o.connect(g).connect(ac.destination);
    o.start(sparkleStart + i * 0.11);
    o.stop(sparkleStart + i * 0.11 + 0.3);
  });
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
