import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn as useSFn } from "@tanstack/react-start";
import { getWallet, getMyProfile, listTransactions } from "@/lib/wallet.functions";
import { BalanceCard } from "@/components/premium/BalanceCard";
import { ArrowLeftRight, Receipt, Wallet as WalletIcon, ArrowRight } from "lucide-react";
import walletImg from "@/assets/wallet-3d.png";
import { brl, brDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início — SmartVoz Wallet" },
      { name: "description", content: "Seu painel SmartVoz: saldo, atalhos para transferência, saque e extrato." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const wFn = useSFn(getWallet);
  const pFn = useSFn(getMyProfile);
  const tFn = useSFn(listTransactions);

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => wFn() });
  const profile = useQuery({ queryKey: ["me"], queryFn: () => pFn() });
  const recent = useQuery({
    queryKey: ["tx", "recent"],
    queryFn: () => tFn({ data: { page: 1, pageSize: 5, status: "all" } }),
  });

  return (
    <div className="space-y-8 animate-sv-fade-up">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="sv-chip mb-3">Olá, {profile.data?.display_name ?? "bem-vindo"} 👋</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--sv-purple-deep)] tracking-tight">
            Sua carteira SmartVoz
          </h1>
        </div>
        <img src={walletImg} alt="" width={80} height={80} style={{ width: 80, height: 80 }} />
      </header>

      <BalanceCard
        size="xl"
        value={Number(wallet.data?.balance_available ?? 0)}
        locked={Number(wallet.data?.balance_locked ?? 0)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink to="/transferencia" Icon={ArrowLeftRight} label="Transferência" desc="Envie para outro usuário" />
        <QuickLink to="/saques" Icon={WalletIcon} label="Solicitar saque" desc="Receba na sua conta (taxa 3%)" />
        <QuickLink to="/extrato" Icon={Receipt} label="Extrato Financeiro" desc="Histórico completo com filtros" />
      </div>

      <section className="sv-card-premium p-7">
        <header className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-[var(--sv-purple-deep)]">Movimentação recente</h2>
          <Link to="/extrato" className="text-[var(--sv-purple)] font-bold text-sm inline-flex items-center gap-1 hover:underline">
            Ver tudo <ArrowRight className="size-4" />
          </Link>
        </header>
        {recent.isLoading ? (
          <p className="text-[var(--sv-muted)] py-8 text-center">Carregando…</p>
        ) : recent.data && recent.data.rows.length > 0 ? (
          <ul className="divide-y divide-[var(--sv-lilac-border)]">
            {recent.data.rows.map((r) => {
              const isOut = r.type === "transfer_out" || r.type === "withdrawal";
              return (
                <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--sv-purple-deep)]">
                      {r.counterpart_name ?? r.description ?? "Movimento"}
                    </p>
                    <p className="text-xs text-[var(--sv-muted)]">{brDate(r.created_at)}</p>
                  </div>
                  <span
                    className="font-extrabold whitespace-nowrap"
                    style={{ color: isOut ? "var(--sv-purple-deep)" : "var(--sv-green-deep)" }}
                  >
                    {isOut ? "−" : "+"}{brl(r.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[var(--sv-muted)] py-8 text-center">Nenhuma movimentação ainda.</p>
        )}
      </section>
    </div>
  );
}

function QuickLink({ to, Icon, label, desc }: { to: string; Icon: any; label: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group sv-card-premium p-5 flex items-center gap-4 hover:-translate-y-0.5 transition"
      style={{ boxShadow: "0 10px 30px rgba(106,13,173,.08)" }}
    >
      <span
        className="size-12 rounded-2xl grid place-items-center text-white shrink-0"
        style={{ background: "var(--gradient-purple-3d)", border: "1.5px solid var(--sv-gold)" }}
      >
        <Icon className="size-6" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-[var(--sv-purple-deep)]">{label}</p>
        <p className="text-sm text-[var(--sv-muted)] truncate">{desc}</p>
      </div>
      <ArrowRight className="size-5 text-[var(--sv-muted)] group-hover:text-[var(--sv-purple)] transition" />
    </Link>
  );
}
