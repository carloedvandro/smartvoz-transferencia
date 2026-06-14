import { useEffect } from "react";
import piggyImg from "@/assets/piggy-3d.png";
import { fireWithdrawalSuccess } from "./SuccessFX";
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
  useEffect(() => {
    if (!open) return;
    playCelebrate();
    fireWithdrawalSuccess();
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;
  const amountBrl = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 sv-modal-overlay animate-sv-fade-up"
      onClick={onClose}
    >
      <div
        className="sv-card-premium relative text-center px-10 py-12 max-w-md w-full animate-sv-scale-in"
        style={{ borderRadius: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={piggyImg}
          alt=""
          width={180}
          height={180}
          style={{ width: 180, height: 180, margin: "0 auto" }}
          className="sv-icon-3d animate-sv-premium-success"
        />
        <h2
          className="mt-4 font-black text-[var(--sv-purple-deep)]"
          style={{ fontSize: 38, lineHeight: 1.05 }}
        >
          {title}
        </h2>
        <p className="mt-2 text-[var(--sv-muted)] text-lg">
          {subtitle ?? "Você sacou"}
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
