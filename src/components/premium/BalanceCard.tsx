import { brl } from "@/lib/format";

export function BalanceCard({
  label = "Saldo disponível",
  value,
  locked,
  size = "lg",
}: {
  label?: string;
  value: number;
  locked?: number;
  size?: "md" | "lg" | "xl";
}) {
  const valueSize = size === "xl" ? 58 : size === "lg" ? 54 : 40;
  return (
    <div
      className="sv-card-balance"
      style={{ padding: size === "xl" ? 32 : 24, minHeight: size === "xl" ? 220 : undefined }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="sv-chip mb-3">{label}</p>
          <p className="sv-text-green font-black leading-none tracking-tight" style={{ fontSize: valueSize }}>
            {brl(value)}
          </p>
        </div>
        {locked != null && (
          <div className="text-right">
            <p className="text-sm text-[var(--sv-muted)] font-semibold uppercase tracking-wider mb-1">Bloqueado</p>
            <p className="font-extrabold" style={{ fontSize: 34, color: "var(--sv-orange)" }}>
              {brl(locked)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
