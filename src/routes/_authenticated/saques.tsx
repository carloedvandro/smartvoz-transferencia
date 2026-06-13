import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWallet, requestWithdrawal, listWithdrawals } from "@/lib/wallet.functions";
import { BalanceCard } from "@/components/premium/BalanceCard";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { EmptyState } from "@/components/premium/EmptyState";
import walletImg from "@/assets/wallet-3d.png";
import piggyImg from "@/assets/piggy-3d.png";
import { brl, brDate } from "@/lib/format";
import { toast } from "sonner";
import { fireWithdrawalSuccess } from "@/components/premium/SuccessFX";

export const Route = createFileRoute("/_authenticated/saques")({
  head: () => ({
    meta: [
      { title: "Saques — SmartVoz Wallet" },
      { name: "description", content: "Solicite saques da sua carteira SmartVoz com taxa de 3% e acompanhe o histórico." },
    ],
  }),
  component: SaquesPage,
});

const MIN = 50;
const FEE = 0.03;

function SaquesPage() {
  const qc = useQueryClient();
  const wFn = useServerFn(getWallet);
  const rFn = useServerFn(requestWithdrawal);
  const lFn = useServerFn(listWithdrawals);

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => wFn() });
  const list = useQuery({ queryKey: ["withdrawals"], queryFn: () => lFn({ data: { page: 1, pageSize: 20, status: "all" } }) });

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [shake, setShake] = useState(false);

  const balance = Number(wallet.data?.balance_available ?? 0);
  const locked = Number(wallet.data?.balance_locked ?? 0);
  const amt = Number(amount.replace(",", "."));
  const fee = +(amt * FEE).toFixed(2);
  const net = +(amt - fee).toFixed(2);
  const valid = amt >= MIN && amt <= balance;

  const mutate = useMutation({
    mutationFn: () => rFn({ data: { amount: amt } }),
    onSuccess: () => {
      fireWithdrawalSuccess();
      toast.success("Saque solicitado!");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      qc.invalidateQueries({ queryKey: ["tx"] });
      setTimeout(() => {
        setOpen(false);
        setAmount("");
      }, 600);
    },
    onError: (e) => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(e instanceof Error ? e.message : "Falha");
    },
  });

  return (
    <div className="space-y-8 animate-sv-fade-up">
      <header className="flex items-center gap-4">
        <img src={walletImg} alt="" width={90} height={90} style={{ width: 90, height: 90 }} />
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--sv-purple-deep)]">Saques</h1>
          <p className="text-[var(--sv-muted)] text-lg">Solicite saques e acompanhe seu histórico</p>
        </div>
      </header>

      <BalanceCard size="xl" value={balance} locked={locked} />

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setOpen(true)} className="sv-btn-premium h-[72px] px-10 text-xl">
          Solicitar saque
        </button>
      </div>

      <section className="sv-card-premium p-7">
        <h2 className="text-xl font-extrabold text-[var(--sv-purple-deep)] mb-5">Histórico de saques</h2>
        {list.isLoading ? (
          <p className="text-[var(--sv-muted)] py-8 text-center">Carregando…</p>
        ) : list.data && list.data.rows.length > 0 ? (
          <ul className="divide-y divide-[var(--sv-lilac-border)]">
            {list.data.rows.map((w: any) => (
              <li key={w.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-[var(--sv-purple-deep)]">Saque {brl(w.amount)}</p>
                  <p className="text-xs text-[var(--sv-muted)]">
                    {brDate(w.created_at)} · taxa {brl(w.fee)} · líquido {brl(w.net_amount)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    w.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : w.status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {w.status === "pending" ? "Em análise" : w.status === "completed" ? "Concluído" : w.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="Nenhuma solicitação de saque realizada ainda." variant="piggy" />
        )}
      </section>

      <PremiumModal
        open={open}
        onClose={() => setOpen(false)}
        icon={<img src={piggyImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />}
        title="Solicitar saque"
        description={`Valor mínimo de ${brl(MIN)}. Taxa de 3% aplicada sobre o valor solicitado.`}
      >
        <div className="space-y-6">
          <BalanceCard label="Saldo disponível" value={balance} />

          <div>
            <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Valor do saque</label>
            <input
              inputMode="decimal"
              className="sv-input-premium"
              style={{ height: 84, fontSize: 36, fontWeight: 700, paddingLeft: 24, paddingRight: 24, borderRadius: 24 }}
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            />
            {amt > 0 && amt < MIN && (
              <p className="text-[var(--sv-orange)] text-sm mt-2 font-semibold">Mínimo de {brl(MIN)}.</p>
            )}
            {amt > balance && <p className="text-[var(--sv-orange)] text-sm mt-2 font-semibold">Saldo insuficiente.</p>}
          </div>

          <div className="sv-card-balance grid grid-cols-3 gap-2 text-center" style={{ padding: 20 }}>
            <Stat label="Solicitado" value={brl(amt || 0)} />
            <Stat label="Taxa 3%" value={brl(fee || 0)} color="var(--sv-orange)" />
            <Stat label="Líquido" value={brl(net > 0 ? net : 0)} bigGreen />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="sv-btn-ghost" style={{ height: 72, padding: "0 36px", fontSize: 22 }}>
              Cancelar
            </button>
            <button
              disabled={!valid || mutate.isPending}
              onClick={() => mutate.mutate()}
              className={`sv-btn-premium ${shake ? "animate-sv-shake" : ""}`}
              style={{ height: 72, padding: "0 42px", fontSize: 24 }}
            >
              {mutate.isPending ? "Processando…" : "Confirmar saque"}
            </button>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}

function Stat({ label, value, color, bigGreen }: { label: string; value: string; color?: string; bigGreen?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--sv-muted)] mb-1">{label}</p>
      {bigGreen ? (
        <p className="sv-text-green font-black text-2xl">{value}</p>
      ) : (
        <p className="font-extrabold text-xl" style={{ color: color ?? "var(--sv-purple-deep)" }}>
          {value}
        </p>
      )}
    </div>
  );
}
