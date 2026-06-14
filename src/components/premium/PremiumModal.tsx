import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function PremiumModal({
  open,
  onClose,
  icon,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
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
      className="sv-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="sv-card-premium sv-hide-scrollbar animate-sv-scale-in w-full max-w-[860px] max-h-[90vh] overflow-y-auto relative"
        style={{ padding: 36 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-5 right-5 size-10 rounded-full grid place-items-center text-[var(--sv-muted)] hover:bg-[var(--sv-lilac)] transition"
        >
          <X className="size-5" />
        </button>

        <header className="flex items-center gap-4 mb-7">
          {icon && (
            <div className="shrink-0" style={{ width: 72, height: 72 }}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="font-extrabold text-[var(--sv-purple-deep)] leading-tight" style={{ fontSize: 42 }}>
              {title}
            </h2>
            {description && (
              <p className="text-[var(--sv-muted)] mt-1" style={{ fontSize: 20, lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
