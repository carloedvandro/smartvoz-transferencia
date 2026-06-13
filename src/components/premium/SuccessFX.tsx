import confetti from "canvas-confetti";

export function fireWithdrawalSuccess() {
  const end = Date.now() + 1100;
  const colors = ["#F6C756", "#FFE08A", "#B84CFF", "#6A0DAD"];
  // initial burst
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 50,
    origin: { y: 0.45 },
    colors,
    scalar: 1.1,
  });
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      scalar: 0.9,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
