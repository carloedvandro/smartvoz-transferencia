import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function PremiumModal({
  open,
  onClose,
  icon,
  title,
  description,
  children,
  plain = false,
}: {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  plain?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`sv-modal-overlay ${plain ? "" : "sv-modal-overlay-dim"} sv-modal-root fixed inset-0 z-50 flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`sv-modal-shell sv-hide-scrollbar animate-sv-scale-in w-full max-w-[860px] max-h-[90vh] overflow-y-auto relative ${plain ? "sv-modal-shell-plain" : "sv-card-premium"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-4 right-4 size-10 rounded-full grid place-items-center text-[var(--sv-muted)] hover:bg-[var(--sv-lilac)] transition z-10"
        >
          <X className="size-5" />
        </button>

        <header className="sv-modal-header flex items-center gap-4 mb-7">
          {icon && (
            <div className="shrink-0 sv-modal-icon" style={{ width: 72, height: 72 }}>
              {icon}
            </div>
          )}
          <div className="sv-modal-titles min-w-0">
            <h2 className="sv-modal-title font-extrabold text-[var(--sv-purple-deep)] leading-tight">
              {title}
            </h2>
            {description && (
              <p className="sv-modal-desc text-[var(--sv-muted)] mt-1">
                {description}
              </p>
            )}
          </div>
        </header>

        <div className="sv-modal-body">{children}</div>
      </div>
    </div>
  );
}
