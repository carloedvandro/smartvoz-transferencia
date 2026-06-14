import { useEffect, useState } from "react";
import piggyImg from "@/assets/piggy-3d.png";
import { firePiggyExplosion } from "./SuccessFX";
import { playCelebrate } from "@/lib/sound";

export function CelebrationOverlay({
  open,
  onClose,
  amount,
  title = "Parabéns!",
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  title?: string;
  subtitle?: string;
}) {
  const [phase, setPhase] = useState<"shake" | "burst">("shake");

  useEffect(() => {
    if (!open) return;
    setPhase("shake");
    playCelebrate();
    // Trigger explosion right after the piggy "breaks"
    const t1 = setTimeout(() => {
      setPhase("burst");
      firePiggyExplosion();
    }, 900);
    const t2 = setTimeout(onClose, 5600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, onClose]);


  if (!open) return null;
  const amountBrl = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 sv-modal-overlay animate-sv-fade-up"
      onClick={onClose}
    >
      <div
        className="sv-card-premium relative text-center px-10 py-12 max-w-md w-full animate-sv-scale-in overflow-hidden"
        style={{ borderRadius: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
          {/* Glow halo */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(255,215,90,.55), rgba(184,76,255,.25) 55%, transparent 75%)",
              filter: "blur(8px)",
              animation: "sv-halo-pulse 1.6s ease-in-out infinite",
            }}
          />
          <img
            src={piggyImg}
            alt=""
            width={200}
            height={200}
            style={{ width: 200, height: 200 }}
            className={`relative sv-icon-3d ${phase === "shake" ? "sv-piggy-shake" : "sv-piggy-burst"}`}
          />
        </div>

        <h2
          className="mt-4 font-black text-[var(--sv-purple-deep)]"
          style={{ fontSize: 38, lineHeight: 1.05 }}
        >
          {title}
        </h2>
        <p className="mt-2 text-[var(--sv-muted)] text-lg">
          {subtitle ?? "Você acabou de fazer um saque pelo seu desempenho. Continue trabalhando e colhendo os frutos!"}
        </p>
        <p className="sv-balance-mega mt-2" style={{ fontSize: 48 }}>
          {amountBrl}
        </p>
        <button
          onClick={onClose}
          className="sv-btn-premium sv-btn-premium-tall mt-6 px-8"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
