import confetti from "canvas-confetti";

const GOLD = ["#F6C756", "#FFE08A", "#FFC400", "#FFB300", "#FFD700"];
const PURPLE = ["#B84CFF", "#8A2BE2", "#6A0DAD", "#D9A6FF"];
const GREEN = ["#9DF5C7", "#4FE3A2", "#1FB877", "#0E8F5C"];
const PINK = ["#FFB3D9", "#FF6FB5", "#E83E8C", "#FF9AC6"];
const BLUE = ["#A6D8FF", "#3FA9FF", "#0E72D6", "#7FC4FF"];
const ORANGE = ["#FFD7A6", "#FFA94D", "#E8740F", "#FF8C42"];

function shower(opts: { colors: string[]; ms: number; shapes?: ("square" | "circle" | "star")[] }) {
  const end = Date.now() + opts.ms;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      origin: { x: 0, y: 0.75 },
      colors: opts.colors,
      shapes: opts.shapes,
      scalar: 1.05,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      origin: { x: 1, y: 0.75 },
      colors: opts.colors,
      shapes: opts.shapes,
      scalar: 1.05,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Big piggy-bank explosion: bursts coins from center and keeps raining gold for ~4s. */
export function firePiggyExplosion() {
  // Central burst
  confetti({
    particleCount: 220,
    spread: 130,
    startVelocity: 75,
    origin: { y: 0.5 },
    colors: [...GOLD, ...PURPLE],
    scalar: 1.5,
    ticks: 260,
  });
  // Star ring
  confetti({
    particleCount: 90,
    spread: 360,
    startVelocity: 45,
    origin: { y: 0.5 },
    colors: GOLD,
    shapes: ["star"],
    scalar: 1.6,
    ticks: 220,
  });
  // Side coin shower for 4s
  shower({ colors: GOLD, ms: 4000 });
  // Rain from top — continuous gold coins
  const end = Date.now() + 4500;
  (function rain() {
    confetti({
      particleCount: 8,
      startVelocity: 15,
      spread: 180,
      origin: { x: Math.random(), y: -0.05 },
      gravity: 1.1,
      colors: GOLD,
      shapes: ["circle"],
      scalar: 1.2,
      ticks: 320,
    });
    if (Date.now() < end) setTimeout(rain, 90);
  })();
}

/** Standard withdrawal success — kept for compatibility. */
export function fireWithdrawalSuccess() {
  firePiggyExplosion();
}

/** Different FX per item category for the Visualizar modal. */
export function fireCategoryFX(categoria: string) {
  switch (categoria) {
    case "Carteira":
      confetti({ particleCount: 140, spread: 110, startVelocity: 55, origin: { y: 0.45 }, colors: GREEN, scalar: 1.3 });
      shower({ colors: GREEN, ms: 1500 });
      break;
    case "Comissão":
      confetti({ particleCount: 160, spread: 120, startVelocity: 60, origin: { y: 0.45 }, colors: GOLD, shapes: ["circle"], scalar: 1.4 });
      confetti({ particleCount: 50, spread: 360, startVelocity: 25, origin: { y: 0.45 }, colors: GOLD, shapes: ["star"], scalar: 1.4 });
      break;
    case "Parceria":
      confetti({ particleCount: 130, spread: 100, startVelocity: 50, origin: { y: 0.45 }, colors: PINK, shapes: ["star"], scalar: 1.3 });
      shower({ colors: [...PINK, ...GOLD], ms: 1200 });
      break;
    case "Níveis":
      confetti({ particleCount: 180, spread: 140, startVelocity: 65, origin: { y: 0.5 }, colors: [...PURPLE, ...GOLD], scalar: 1.5 });
      confetti({ particleCount: 60, spread: 360, startVelocity: 30, origin: { y: 0.5 }, colors: GOLD, shapes: ["star"], scalar: 1.6 });
      break;
    case "Rede":
      confetti({ particleCount: 150, spread: 120, startVelocity: 55, origin: { y: 0.45 }, colors: BLUE, scalar: 1.3 });
      shower({ colors: [...BLUE, ...PURPLE], ms: 1400 });
      break;
    case "Transferência de saldo":
    case "Transferência":
      confetti({ particleCount: 140, spread: 100, startVelocity: 60, origin: { x: 0.2, y: 0.5 }, angle: 60, colors: PURPLE, scalar: 1.3 });
      confetti({ particleCount: 140, spread: 100, startVelocity: 60, origin: { x: 0.8, y: 0.5 }, angle: 120, colors: GOLD, scalar: 1.3 });
      break;
    case "Solicitação de saque":
    case "Saque":
      firePiggyExplosion();
      break;
    default:
      confetti({ particleCount: 120, spread: 100, startVelocity: 50, origin: { y: 0.5 }, colors: [...GOLD, ...PURPLE], scalar: 1.3 });
      shower({ colors: [...GOLD, ...ORANGE], ms: 1200 });
  }
}
