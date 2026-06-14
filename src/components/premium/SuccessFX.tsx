import confetti from "canvas-confetti";

export function fireWithdrawalSuccess() {
  const end = Date.now() + 2400;
  const colors = ["#F6C756", "#FFE08A", "#FFC400", "#B84CFF", "#8A2BE2", "#6A0DAD"];

  // Initial central burst — big gold explosion
  confetti({
    particleCount: 160,
    spread: 100,
    startVelocity: 60,
    origin: { y: 0.45 },
    colors,
    scalar: 1.3,
    ticks: 220,
  });

  // Star-shaped sparkles
  confetti({
    particleCount: 60,
    spread: 360,
    startVelocity: 35,
    origin: { y: 0.45 },
    colors: ["#FFE08A", "#F6C756"],
    shapes: ["star"],
    scalar: 1.5,
    ticks: 180,
  });

  // Continuous side-cannons of "coins"
  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0, y: 0.75 },
      colors,
      scalar: 1.05,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 65,
      startVelocity: 55,
      origin: { x: 1, y: 0.75 },
      colors,
      scalar: 1.05,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Final golden shower from the top
  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 140,
      startVelocity: 25,
      origin: { y: 0 },
      gravity: 0.8,
      colors: ["#F6C756", "#FFE08A", "#FFC400"],
      scalar: 1.1,
    });
  }, 700);
}
