import { brl, brDate } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, Banknote, Wallet as WalletIcon } from "lucide-react";

type Row = {
  id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  counterpart_name: string | null;
  description: string | null;
  created_at: string;
};

const iconFor = (t: string) => {
  if (t === "transfer_in") return { Icon: ArrowDownLeft, color: "var(--sv-green-deep)", bg: "rgba(0,217,126,.12)" };
  if (t === "transfer_out") return { Icon: ArrowUpRight, color: "var(--sv-purple)", bg: "rgba(106,13,173,.12)" };
  if (t === "withdrawal") return { Icon: Banknote, color: "var(--sv-orange)", bg: "rgba(255,90,31,.12)" };
  return { Icon: WalletIcon, color: "var(--sv-purple-deep)", bg: "rgba(33,0,75,.08)" };
};

const labelFor = (t: string) =>
  ({ transfer_in: "Recebido", transfer_out: "Enviado", withdrawal: "Saque", deposit: "Depósito" })[t] ?? t;

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  return map[s] ?? "bg-slate-50 text-slate-700 border-slate-200";
};

export function TransactionsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--sv-lilac-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[var(--sv-lilac)] text-[var(--sv-purple-deep)]">
            <tr className="text-sm">
              <th className="px-5 py-4 font-bold">Tipo</th>
              <th className="px-5 py-4 font-bold">Descrição</th>
              <th className="px-5 py-4 font-bold">Data</th>
              <th className="px-5 py-4 font-bold">Status</th>
              <th className="px-5 py-4 font-bold text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { Icon, color, bg } = iconFor(r.type);
              const isOut = r.type === "transfer_out" || r.type === "withdrawal";
              return (
                <tr
                  key={r.id}
                  className="border-t border-[var(--sv-lilac-border)] hover:bg-[var(--sv-lilac)]/40 transition"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-10 rounded-xl grid place-items-center"
                        style={{ background: bg, color }}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="font-semibold text-[var(--sv-purple-deep)]">{labelFor(r.type)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--sv-muted)]">
                    {r.counterpart_name ? (
                      <span>
                        <span className="text-[var(--sv-purple-deep)] font-medium">{r.counterpart_name}</span>
                        {r.description ? ` · ${r.description}` : ""}
                      </span>
                    ) : (
                      r.description ?? "—"
                    )}
                  </td>
                  <td className="px-5 py-4 text-[var(--sv-muted)] whitespace-nowrap">{brDate(r.created_at)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge(r.status)}`}>
                      {r.status === "completed" ? "Concluído" : r.status === "pending" ? "Pendente" : r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <span className="font-extrabold text-lg" style={{ color: isOut ? "var(--sv-purple-deep)" : "var(--sv-green-deep)" }}>
                      {isOut ? "−" : "+"}
                      {brl(r.amount)}
                    </span>
                    {Number(r.fee) > 0 && (
                      <p className="text-xs text-[var(--sv-muted)]">taxa {brl(r.fee)}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
