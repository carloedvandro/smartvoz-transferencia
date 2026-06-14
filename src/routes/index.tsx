import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeftRight, Plus, Search, Wallet, Lock, PiggyBank, Info, ShieldCheck, X, AlertCircle } from "lucide-react";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { fireWithdrawalSuccess } from "@/components/premium/SuccessFX";
import walletImg from "@/assets/wallet-3d.png";
import transferImg from "@/assets/transfer-3d.png";
import piggyImg from "@/assets/piggy-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saques — SmartVoz" },
      { name: "description", content: "Gerencie seus saques e transferências SmartVoz com identidade visual premium." },
    ],
  }),
  component: SaquesPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const REDE_MOCK = [
  { code: "SV123456", name: "Carlos Andrade" },
  { code: "SV234567", name: "Mariana Lopes" },
  { code: "SV345678", name: "Rafael Souza" },
  { code: "SV456789", name: "Beatriz Cunha" },
];

function SaquesPage() {
  const [balance, setBalance] = useState(50.0);
  const [locked] = useState(0);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [history, setHistory] = useState<
    { id: string; type: "saque" | "transferencia"; amount: number; net?: number; to?: string; at: Date }[]
  >([]);

  return (
    <div className="min-h-screen bg-[var(--sv-lilac)]">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14 space-y-8 animate-sv-fade-up">
        {/* HEADER */}
        <header className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <img src={walletImg} alt="" width={84} height={84} style={{ width: 84, height: 84 }} className="sv-icon-3d" />
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--sv-purple-deep)] tracking-tight">Saques</h1>
              <p className="text-[var(--sv-muted)] text-lg md:text-xl mt-1">Gerencie seus saques e visualize seu histórico</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setOpenTransfer(true)} className="sv-btn-gold-tall inline-flex items-center gap-2">
              <ArrowLeftRight className="size-5" /> Transferir
            </button>
            <button onClick={() => setOpenWithdraw(true)} className="sv-btn-premium sv-btn-premium-tall inline-flex items-center gap-2">
              <Plus className="size-5" /> Novo Saque
            </button>
          </div>
        </header>

        {/* BALANCE CARD */}
        <section className="sv-card-premium p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <span
              className="size-12 rounded-2xl grid place-items-center"
              style={{
                background: "var(--gradient-gold-shine)",
                border: "1.5px solid var(--sv-gold)",
                boxShadow: "var(--shadow-gold-glow)",
              }}
            >
              <Wallet className="size-6 text-[var(--sv-purple-deep)]" />
            </span>
            <h2 className="font-extrabold text-[var(--sv-purple-deep)] text-2xl">Saldo</h2>
          </div>

          <div className="flex items-center justify-between gap-6 flex-wrap">
            <p className="text-[var(--sv-muted)] text-lg">Disponível para saque</p>
            <p className="sv-balance-mega tabular-nums">
              {brl(balance)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-6 flex-wrap">
            <p className="text-[var(--sv-muted)] text-lg">Saldo bloqueado</p>
            <p className="font-bold tabular-nums text-[var(--sv-orange)] text-2xl inline-flex items-center gap-2">
              <Lock className="size-5" /> {brl(locked)}
            </p>
          </div>
        </section>

        {/* HISTORY */}
        <section>
          <h2 className="text-2xl font-extrabold text-[var(--sv-purple-deep)] mb-4">Histórico de Saques</h2>
          <div className="sv-card-premium p-6 md:p-8">
            {history.length === 0 ? (
              <p className="text-center text-[var(--sv-muted)] py-10">Nenhum saque encontrado.</p>
            ) : (
              <ul className="divide-y divide-[var(--sv-lilac-border)]">
                {history.map((h) => (
                  <li key={h.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--sv-purple-deep)]">
                        {h.type === "saque" ? "Solicitação de saque" : `Transferência para ${h.to}`}
                      </p>
                      <p className="text-xs text-[var(--sv-muted)]">
                        {h.at.toLocaleString("pt-BR")}
                        {h.type === "saque" && h.net !== undefined && (
                          <> · líquido {brl(h.net)}</>
                        )}
                      </p>
                    </div>
                    <span className="font-extrabold text-[var(--sv-purple-deep)] whitespace-nowrap">
                      − {brl(h.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <TransferModal
        open={openTransfer}
        onClose={() => setOpenTransfer(false)}
        balance={balance}
        onConfirm={(amount, to) => {
          setBalance((b) => b - amount);
          setHistory((h) => [{ id: crypto.randomUUID(), type: "transferencia", amount, to, at: new Date() }, ...h]);
          fireWithdrawalSuccess();
        }}
      />

      <WithdrawModal
        open={openWithdraw}
        onClose={() => setOpenWithdraw(false)}
        balance={balance}
        locked={locked}
        onConfirm={(amount, net) => {
          setBalance((b) => b - amount);
          setHistory((h) => [{ id: crypto.randomUUID(), type: "saque", amount, net, at: new Date() }, ...h]);
          fireWithdrawalSuccess();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TRANSFER MODAL                                                      */
/* ------------------------------------------------------------------ */
function TransferModal({
  open,
  onClose,
  balance,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  onConfirm: (amount: number, to: string) => void;
}) {
  const [step, setStep] = useState<"pick" | "amount" | "done">("pick");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<{ code: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const lower = q.toLowerCase();
    return REDE_MOCK.filter((u) => u.name.toLowerCase().includes(lower) || u.code.toLowerCase().includes(lower));
  }, [q]);

  const amt = Number(amount.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
  const valid = selected && amt > 0 && amt <= balance;

  function close() {
    onClose();
    setTimeout(() => {
      setStep("pick");
      setQ("");
      setSelected(null);
      setAmount("");
    }, 200);
  }

  return (
    <PremiumModal
      open={open}
      onClose={close}
      icon={<img src={transferImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />}
      title="Transferir Saldo"
      description={
        step === "pick"
          ? "Busque pelo nome ou código do usuário para quem deseja transferir"
          : step === "amount"
          ? `Informe o valor a transferir para ${selected?.name}`
          : "Transferência concluída"
      }
    >
      {/* SALDO DISPONÍVEL — PREMIUM CARD */}
      <div className="sv-card-balance flex items-center justify-between gap-4 p-5 mb-6">
        <span className="text-[var(--sv-muted)] text-lg font-semibold">Saldo disponível</span>
        <span className="sv-text-green font-black tabular-nums" style={{ fontSize: 30 }}>
          {brl(balance)}
        </span>
      </div>

      {step === "pick" && (
        <>
          <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Buscar usuário</label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-xl grid place-items-center"
              style={{ background: "var(--gradient-gold-shine)", border: "1.5px solid var(--sv-gold)" }}
            >
              <Search className="size-4 text-[var(--sv-purple-deep)]" />
            </span>
            <input
              autoFocus
              className="sv-input-premium pl-16 pr-5"
              style={{ height: 64, fontSize: 18 }}
              placeholder="Digite o nome ou código (ex: SV123456)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {q.trim().length >= 2 ? (
            <ul className="mt-3 max-h-60 overflow-y-auto rounded-2xl border border-[var(--sv-lilac-border)] bg-white divide-y divide-[var(--sv-lilac-border)]">
              {results.length === 0 ? (
                <li className="px-5 py-4 text-sm text-[var(--sv-muted)]">Nenhum usuário encontrado na sua rede.</li>
              ) : (
                results.map((u) => (
                  <li key={u.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(u);
                        setStep("amount");
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-[var(--sv-lilac)] flex items-center gap-3 transition"
                    >
                      <span
                        className="size-11 rounded-full grid place-items-center text-white font-extrabold"
                        style={{ background: "var(--gradient-purple-3d)", border: "1.5px solid var(--sv-gold)" }}
                      >
                        {u.name.charAt(0)}
                      </span>
                      <span>
                        <span className="block font-semibold text-[var(--sv-purple-deep)]">{u.name}</span>
                        <span className="block text-xs text-[var(--sv-muted)]">{u.code}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="text-sm text-[var(--sv-muted)] mt-3">
              Busque pelo nome ou código. Apenas usuários da sua rede serão exibidos.
            </p>
          )}

          {/* AVISO ESCUDO */}
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "#FFF9E8", border: "1.5px solid var(--sv-gold)" }}
          >
            <span
              className="size-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: "var(--gradient-gold-shine)", border: "1.5px solid var(--sv-gold)" }}
            >
              <ShieldCheck className="size-5 text-[var(--sv-purple-deep)]" />
            </span>
            <p className="text-sm font-semibold text-[var(--sv-purple-deep)] leading-snug">
              Você só pode transferir para usuários da sua rede: quem indicou você ou seus indicados.
            </p>
          </div>

          <div className="flex justify-end mt-7">
            <button onClick={close} className="sv-btn-ghost h-14 px-8 text-lg">
              Cancelar
            </button>
          </div>
        </>
      )}

      {step === "amount" && selected && (
        <>
          <div className="sv-card-balance flex items-center gap-3 p-4 mb-5">
            <span
              className="size-11 rounded-full grid place-items-center text-white font-extrabold"
              style={{ background: "var(--gradient-purple-3d)", border: "1.5px solid var(--sv-gold)" }}
            >
              {selected.name.charAt(0)}
            </span>
            <div className="flex-1">
              <p className="font-bold text-[var(--sv-purple-deep)]">{selected.name}</p>
              <p className="text-xs text-[var(--sv-muted)]">{selected.code}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setStep("pick");
              }}
              className="size-9 rounded-full grid place-items-center text-[var(--sv-muted)] hover:bg-[var(--sv-lilac)]"
              aria-label="Trocar destinatário"
            >
              <X className="size-4" />
            </button>
          </div>

          <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Valor da transferência</label>
          <input
            autoFocus
            inputMode="decimal"
            className="sv-input-premium"
            style={{ height: 72, fontSize: 32, fontWeight: 800, padding: "0 24px", borderRadius: 22 }}
            placeholder="R$ 0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
          />
          {amt > balance && (
            <p className="mt-2 text-sm font-semibold text-[var(--sv-orange)] inline-flex items-center gap-2 animate-sv-shake">
              <AlertCircle className="size-4" /> Saldo insuficiente.
            </p>
          )}

          <div className="flex justify-end gap-3 mt-7">
            <button onClick={close} className="sv-btn-ghost h-14 px-7 text-lg">Cancelar</button>
            <button
              disabled={!valid}
              onClick={() => {
                onConfirm(amt, selected.name);
                setStep("done");
              }}
              className="sv-btn-premium h-14 px-8 text-lg"
            >
              Confirmar transferência
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <div className="py-8 text-center">
          <img src={transferImg} alt="" width={120} height={120} style={{ width: 120, height: 120 }} className="mx-auto drop-shadow-[0_15px_30px_rgba(246,199,86,.5)]" />
          <h3 className="mt-5 text-3xl font-extrabold text-[var(--sv-purple-deep)]">Transferência realizada com sucesso!</h3>
          <p className="mt-2 text-[var(--sv-muted)] text-lg">{brl(amt)} enviado para {selected?.name}.</p>
          <button onClick={close} className="sv-btn-premium h-14 px-10 mt-7 text-lg">Concluir</button>
        </div>
      )}
    </PremiumModal>
  );
}

/* ------------------------------------------------------------------ */
/* WITHDRAW MODAL                                                      */
/* ------------------------------------------------------------------ */
function WithdrawModal({
  open,
  onClose,
  balance,
  locked,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  balance: number;
  locked: number;
  onConfirm: (amount: number, net: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  const amt = Number(amount.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
  const fee = +(amt * 0.03).toFixed(2);
  const net = +(amt - fee).toFixed(2);
  const total = balance + locked;
  const valid = amt > 0 && amt <= balance;

  function close() {
    onClose();
    setTimeout(() => {
      setAmount("");
      setDone(false);
    }, 200);
  }

  return (
    <PremiumModal
      open={open}
      onClose={close}
      icon={<img src={walletImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />}
      title="Solicitar Saque"
      description={done ? "Saque solicitado com sucesso" : "Preencha os dados abaixo para solicitar um saque"}
    >
      {!done ? (
        <>
          {/* CARD BANCÁRIO PREMIUM */}
          <div className="sv-card-balance p-5 mb-5 space-y-3">
            <Row
              icon={<PiggyBank className="size-4 text-[var(--sv-purple-deep)]" />}
              label="Disponível para saque"
              value={<span className="sv-text-green font-black text-2xl tabular-nums">{brl(balance)}</span>}
            />
            <Row
              icon={<Lock className="size-4 text-[var(--sv-purple-deep)]" />}
              label="Saldo bloqueado"
              value={<span className="text-[var(--sv-orange)] font-bold text-xl tabular-nums">{brl(locked)}</span>}
            />
            <div className="h-px bg-[var(--sv-lilac-border)]" />
            <Row
              icon={<Wallet className="size-4 text-[var(--sv-purple-deep)]" />}
              label={<span className="font-bold text-[var(--sv-purple-deep)]">Saldo total</span>}
              value={<span className="font-black text-[var(--sv-purple-deep)] text-2xl tabular-nums">{brl(total)}</span>}
            />
          </div>

          {/* AVISO TAXA */}
          <div
            className="flex items-start gap-3 rounded-2xl p-4 mb-5"
            style={{ background: "#FFF9E8", border: "1.5px solid var(--sv-gold)" }}
          >
            <span
              className="size-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: "var(--gradient-gold-shine)", border: "1.5px solid var(--sv-gold)" }}
            >
              <Info className="size-5 text-[var(--sv-purple-deep)]" />
            </span>
            <p className="text-sm font-semibold text-[var(--sv-purple-deep)] leading-snug">
              Cada saque terá uma taxa de <b>3%</b> sobre o valor solicitado.
            </p>
          </div>

          <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Valor do saque</label>
          <input
            autoFocus
            inputMode="decimal"
            className={`sv-input-premium ${amt > 0 ? "sv-glow-gold" : ""}`}
            style={{ height: 72, fontSize: 32, fontWeight: 800, padding: "0 24px", borderRadius: 22 }}
            placeholder="R$ 0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
          />
          {amt > balance && (
            <p className="mt-2 text-sm font-semibold text-[var(--sv-orange)] inline-flex items-center gap-2 animate-sv-shake">
              <AlertCircle className="size-4" /> Valor excede o saldo disponível.
            </p>
          )}

          {/* RESUMO */}
          <div className="sv-card-balance p-5 mt-5 space-y-3">
            <div className="flex justify-between text-[var(--sv-muted)]">
              <span>Valor solicitado:</span>
              <span className="tabular-nums font-semibold text-[var(--sv-purple-deep)]">{brl(amt)}</span>
            </div>
            <div className="flex justify-between text-[var(--sv-muted)]">
              <span>Taxa (3%):</span>
              <span className="tabular-nums font-semibold text-[var(--sv-orange)]">− {brl(fee)}</span>
            </div>
            <div className="h-px bg-[var(--sv-lilac-border)]" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--sv-purple-deep)] text-lg">Valor líquido:</span>
              <span
                className="sv-text-green font-black tabular-nums"
                style={{ fontSize: 40, textShadow: "0 0 20px rgba(0,210,106,.25)" }}
              >
                {brl(net)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-7">
            <button onClick={close} className="sv-btn-ghost h-[60px] px-8 text-lg">Cancelar</button>
            <button
              disabled={!valid}
              onClick={() => {
                onConfirm(amt, net);
                setDone(true);
              }}
              className="sv-btn-premium h-[60px] px-10 text-lg"
              style={{ borderRadius: 18 }}
            >
              Continuar
            </button>
          </div>
        </>
      ) : (
        <div className="py-8 text-center">
          <img src={piggyImg} alt="" width={130} height={130} style={{ width: 130, height: 130 }} className="mx-auto drop-shadow-[0_15px_30px_rgba(246,199,86,.5)]" />
          <h3 className="mt-5 text-3xl font-extrabold text-[var(--sv-purple-deep)]">Saque solicitado!</h3>
          <p className="mt-2 text-[var(--sv-muted)] text-lg">
            Valor líquido de <b className="sv-text-green">{brl(net)}</b> em processamento.
          </p>
          <button onClick={close} className="sv-btn-premium h-14 px-10 mt-7 text-lg">Concluir</button>
        </div>
      )}
    </PremiumModal>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-[var(--sv-muted)]">
        <span className="size-7 rounded-lg grid place-items-center" style={{ background: "var(--gradient-gold-shine)", border: "1px solid var(--sv-gold)" }}>
          {icon}
        </span>
        {label}
      </div>
      {value}
    </div>
  );
}
