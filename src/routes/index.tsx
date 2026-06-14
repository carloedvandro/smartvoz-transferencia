import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Plus,
  Search,
  X,
  AlertCircle,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { fireWithdrawalSuccess, fireCategoryFX } from "@/components/premium/SuccessFX";
import { CelebrationOverlay } from "@/components/premium/CelebrationOverlay";
import { playClick, playCategorySound } from "@/lib/sound";
import walletImg from "@/assets/wallet-3d.png";
import transferImg from "@/assets/transfer-3d.png";
import piggyImg from "@/assets/piggy-3d.png";
import moneyImg from "@/assets/money-3d.png";
import coinsImg from "@/assets/coins-3d.png";
import networkImg from "@/assets/network-3d.png";
import levelsImg from "@/assets/levels-3d.png";
import partnershipImg from "@/assets/partnership-3d.png";
import searchImg from "@/assets/search-3d.png";
import lockImg from "@/assets/lock-3d.png";
import infoImg from "@/assets/info-3d.png";
import shieldImg from "@/assets/shield-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saques — SmartVoz" },
      { name: "description", content: "Gerencie saldo, transferências e saques no padrão Premium SmartVoz." },
    ],
  }),
  component: SaquesPage,
});

type TipoMov = "Saldo" | "Transferência" | "Saque";
type StatusMov = "Disponível" | "Concluído" | "Pendente";

type Movimento = {
  id: string;
  titulo: string;
  cliente: string;
  nivel: string;
  data: Date;
  status: StatusMov;
  valor: number; // signed
  tipo: TipoMov;
  categoria: string;
  descricao: string;
  icone: string;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function nivelLabel(nivel: string) {
  const n = nivel.toUpperCase().trim();
  if (n === "N1") return "Nível 1";
  if (n === "N2") return "Nível 2";
  if (n === "N3") return "Nível 3";
  if (n === "N4") return "Nível 4";
  return "—";
}

const REDE_MOCK = [
  { code: "SV123456", name: "Carlos Andrade" },
  { code: "SV234567", name: "Mariana Lopes" },
  { code: "SV345678", name: "Rafael Souza" },
  { code: "SV456789", name: "Beatriz Cunha" },
];

const PAGE_SIZE = 8;

function SaquesPage() {
  const [saldo, setSaldo] = useState(50);
  const [bloqueado] = useState(35);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);


  const [busca, setBusca] = useState("");
  const [fTipo, setFTipo] = useState<"todos" | TipoMov>("todos");
  const [fStatus, setFStatus] = useState<"todos" | StatusMov>("todos");
  const [fPeriodo, setFPeriodo] = useState<"todos" | "7" | "30" | "90">("todos");
  const [page, setPage] = useState(1);

  const [openTransfer, setOpenTransfer] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openSaldo, setOpenSaldo] = useState(false);
  const [detalhe, setDetalhe] = useState<Movimento | null>(null);
  const [celebrate, setCelebrate] = useState<{ open: boolean; amount: number; title?: string; subtitle?: string }>({
    open: false,
    amount: 0,
  });

  const filtrados = useMemo(() => {
    const now = Date.now();
    const days = fPeriodo === "todos" ? Infinity : Number(fPeriodo);
    return movimentos.filter((m) => {
      const buscaOk =
        !busca ||
        m.cliente.toLowerCase().includes(busca.toLowerCase()) ||
        m.titulo.toLowerCase().includes(busca.toLowerCase());
      const tipoOk = fTipo === "todos" || m.tipo === fTipo;
      const statusOk = fStatus === "todos" || m.status === fStatus;
      const periodoOk = days === Infinity || (now - m.data.getTime()) / 86400000 <= days;
      return buscaOk && tipoOk && statusOk && periodoOk;
    });
  }, [movimentos, busca, fTipo, fStatus, fPeriodo]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pageItems = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalSaques = movimentos
    .filter((m) => m.tipo === "Saque")
    .reduce((acc, m) => acc + Math.abs(m.valor), 0);
  const totalTransferido = movimentos
    .filter((m) => m.tipo === "Transferência")
    .reduce((acc, m) => acc + Math.abs(m.valor), 0);

  function exportCSV() {
    const rows = [
      ["Título", "Cliente", "Tipo", "Status", "Data", "Valor"],
      ...filtrados.map((m) => [
        m.titulo,
        m.cliente,
        m.tipo,
        m.status,
        m.data.toLocaleString("pt-BR"),
        m.valor.toFixed(2).replace(".", ","),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saques-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Saques SmartVoz</title>
      <style>body{font-family:Inter,sans-serif;padding:24px;color:#21003f}
      h1{color:#6a0dad}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{padding:8px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
      th{background:#f7f0fb}</style></head><body>
      <h1>Saques SmartVoz</h1>
      <table><thead><tr><th>Título</th><th>Cliente</th><th>Tipo</th><th>Status</th><th>Data</th><th>Valor</th></tr></thead>
      <tbody>${filtrados
        .map(
          (m) =>
            `<tr><td>${m.titulo}</td><td>${m.cliente}</td><td>${m.tipo}</td><td>${m.status}</td><td>${m.data.toLocaleString(
              "pt-BR",
            )}</td><td>${brl(m.valor)}</td></tr>`,
        )
        .join("")}</tbody></table>
      <script>window.onload=()=>window.print()</script></body></html>
    `);
    win.document.close();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-12 space-y-7 animate-sv-fade-up">
        {/* HEADER */}
        <header className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--sv-purple-deep)] tracking-tight">Saques</h1>
            <p className="text-[var(--sv-muted)] text-base md:text-lg mt-1">
              Gerencie seu saldo, transferências e solicitações no padrão Premium SmartVoz.
            </p>
          </div>



          <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:items-center sm:justify-center sm:w-auto">
            <button
              onClick={() => {
                playClick();
                setOpenTransfer(true);
              }}
              className="sv-btn-action sv-btn-action-gold inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeftRight className="size-4" /> Transferir
            </button>
            <button
              onClick={() => {
                playClick();
                setOpenWithdraw(true);
              }}
              className="sv-btn-action sv-btn-action-purple inline-flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="size-4" /> Novo Saque
            </button>
          </div>

        </header>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <SummaryCard
            icon={walletImg}
            label="Saldo disponível"
            value={brl(saldo)}
            hint="Ver saldo detalhado"
            valueClass="sv-text-green"
            onClick={() => {
              playClick();
              setOpenSaldo(true);
            }}
          />

          <SummaryCard
            icon={transferImg}
            label="Transferências"
            value={brl(totalTransferido)}
            hint="Enviar saldo para rede"
            valueClass="sv-text-green"
            onClick={() => {
              playClick();
              setOpenTransfer(true);
            }}
          />
          <SummaryCard
            icon={piggyImg}
            label="Saques do mês"
            value={brl(totalSaques)}
            hint="Solicitações registradas"
            valueClass="sv-text-green"
            onClick={() => {
              playClick();
              setCelebrate({
                open: true,
                amount: totalSaques,
                title: totalSaques > 0 ? "Parabéns!" : "Pronto pra sacar!",
                subtitle:
                  totalSaques > 0
                    ? "Você já sacou este mês"
                    : "Você ainda não realizou saques. Que tal começar agora?",
              });
            }}
          />
        </section>

        {/* FILTERS */}
        <section className="sv-card-premium sv-section-bare p-4 md:p-5">
          <div className="sv-filters-grid">
            <select
              value={fTipo}
              onChange={(e) => { setFTipo(e.target.value as typeof fTipo); setPage(1); }}
              className="sv-filter-pill"
            >
              <option value="todos">Todos os tipos</option>
              <option value="Saldo">Saldo</option>
              <option value="Transferência">Transferência</option>
              <option value="Saque">Saque</option>
            </select>

            <select
              value={fStatus}
              onChange={(e) => { setFStatus(e.target.value as typeof fStatus); setPage(1); }}
              className="sv-filter-pill"
            >
              <option value="todos">Todos status</option>
              <option value="Disponível">Disponível</option>
              <option value="Concluído">Concluído</option>
              <option value="Pendente">Pendente</option>
            </select>

            <select
              value={fPeriodo}
              onChange={(e) => { setFPeriodo(e.target.value as typeof fPeriodo); setPage(1); }}
              className="sv-filter-pill"
            >
              <option value="todos">Todos períodos</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>

            <div className="sv-search-wrap">
              <Search className="size-4 sv-search-icon" />
              <input
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                placeholder="Buscar por cliente ou título"
                className="sv-filter-pill sv-search-input"
              />
            </div>

            <button onClick={exportCSV} className="sv-filter-pill inline-flex items-center justify-center gap-2 font-bold">
              <Download className="size-4" /> CSV
            </button>
            <button onClick={exportPDF} className="sv-filter-pill inline-flex items-center justify-center gap-2 font-bold">
              <FileText className="size-4" /> PDF
            </button>
          </div>
        </section>


        {/* MOVIMENTAÇÕES */}
        <section className="sv-card-premium sv-section-bare p-5 md:p-7">
          <div className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--sv-purple-deep)]">Movimentações de Saques</h2>
            <p className="text-[var(--sv-muted)] text-sm md:text-base mt-1">
              Cada lançamento mostra origem, status, data, valor e ação disponível.
            </p>
          </div>

          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <img
                src={piggyImg}
                alt=""
                width={120}
                height={120}
                style={{ width: 120, height: 120, opacity: 0.5 }}
                className="sv-icon-3d sv-float"
              />
              <p className="mt-5 text-[var(--sv-muted)] text-lg font-medium">Nenhuma movimentação encontrada.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--sv-lilac-border)]">
              {pageItems.map((m) => (
                <li key={m.id} className="py-4">
                  {/* Desktop layout */}
                  <div
                    className="hidden md:grid items-center gap-4"
                    style={{ gridTemplateColumns: "64px minmax(0,1fr) 110px 110px 130px 160px 120px" }}
                  >
                    <img src={m.icone} alt="" width={56} height={56} style={{ width: 56, height: 56 }} className="sv-icon-3d" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-[var(--sv-purple-deep)] truncate">{m.titulo}</p>
                      <p className="text-sm text-[var(--sv-muted)] truncate">Cliente: {m.cliente}</p>
                    </div>
                    <div className="flex justify-center">
                      <span className="font-extrabold text-[var(--sv-purple-deep)] text-sm whitespace-nowrap">{nivelLabel(m.nivel)}</span>
                    </div>
                    <span className="text-sm text-[var(--sv-muted)] whitespace-nowrap text-center">
                      {m.data.toLocaleDateString("pt-BR")}
                    </span>
                    <div className="flex justify-center">
                      <StatusBadge status={m.status} />
                    </div>
                    <span
                      className={`font-black tabular-nums whitespace-nowrap text-lg text-right ${
                        m.valor < 0 ? "text-[var(--sv-orange)]" : "sv-text-green"
                      }`}
                    >
                      {m.valor < 0 ? "− " : ""}
                      {brl(Math.abs(m.valor))}
                    </span>
                    <button
                      onClick={() => {
                        playCategorySound(m.categoria);
                        fireCategoryFX(m.categoria);
                        setDetalhe(m);
                      }}
                      className="sv-btn-premium h-9 px-4 text-sm w-full"
                    >
                      Visualizar
                    </button>
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <img src={m.icone} alt="" width={44} height={44} style={{ width: 44, height: 44 }} className="sv-icon-3d shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[var(--sv-purple-deep)] truncate text-sm">{m.titulo}</p>
                        <p className="text-xs text-[var(--sv-muted)] truncate">Cliente: {m.cliente}</p>
                        <p className="text-[11px] text-[var(--sv-muted)] mt-0.5">{m.data.toLocaleDateString("pt-BR")}</p>
                      </div>
                      <span
                        className={`font-black tabular-nums whitespace-nowrap text-base text-right shrink-0 ${
                          m.valor < 0 ? "text-[var(--sv-orange)]" : "sv-text-green"
                        }`}
                      >
                        {m.valor < 0 ? "− " : ""}
                        {brl(Math.abs(m.valor))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pl-[56px]">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[var(--sv-purple-deep)] text-xs whitespace-nowrap">{nivelLabel(m.nivel)}</span>
                        <StatusBadge status={m.status} />
                      </div>
                      <button
                        onClick={() => {
                          playCategorySound(m.categoria);
                          fireCategoryFX(m.categoria);
                          setDetalhe(m);
                        }}
                        className="sv-btn-premium h-8 px-3 text-xs"
                      >
                        Visualizar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* PAGINATION */}
          <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
            <span className="text-sm text-[var(--sv-muted)]">
              Página {page} de {totalPages} · {filtrados.length} registro(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="sv-filter-pill px-3 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`sv-filter-pill px-3 font-bold ${
                    page === i + 1 ? "bg-[var(--sv-purple)] text-white border-[var(--sv-purple)]" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="sv-filter-pill px-3 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAIS */}
      <SaldoModal
        open={openSaldo}
        onClose={() => setOpenSaldo(false)}
        saldo={saldo}
        bloqueado={bloqueado}
      />

      <TransferModal
        open={openTransfer}
        onClose={() => setOpenTransfer(false)}
        balance={saldo}
        onConfirm={(amount, to) => {
          setSaldo((b) => b - amount);
          setMovimentos((h) => [
            {
              id: crypto.randomUUID(),
              titulo: "Transferência enviada",
              cliente: to,
              nivel: "Rede",
              data: new Date(),
              status: "Concluído",
              valor: -amount,
              tipo: "Transferência",
              categoria: "Transferência de saldo",
              descricao: `Transferência realizada para ${to} na sua rede SmartVoz.`,
              icone: transferImg,
            },
            ...h,
          ]);
          fireCategoryFX("Transferência de saldo");
          setCelebrate({
            open: true,
            amount,
            title: "Transferência enviada!",
            subtitle: `Saldo enviado para ${to} com sucesso.`,
          });
        }}
      />


      <WithdrawModal
        open={openWithdraw}
        onClose={() => setOpenWithdraw(false)}
        balance={saldo}
        locked={bloqueado}
        onConfirm={(amount, net, fee) => {
          setSaldo((b) => b - amount);
          setMovimentos((h) => [
            {
              id: crypto.randomUUID(),
              titulo: "Saque solicitado",
              cliente: "Carteira SmartVoz",
              nivel: "Saque",
              data: new Date(),
              status: "Pendente",
              valor: -net,
              tipo: "Saque",
              categoria: "Solicitação de saque",
              descricao: `Solicitado ${brl(amount)} · Taxa (3%) ${brl(fee)} · Líquido ${brl(net)}.`,
              icone: piggyImg,
            },
            ...h,
          ]);
          fireWithdrawalSuccess();
          setCelebrate({
            open: true,
            amount: net,
            title: "Parabéns!",
            subtitle: `Saque solicitado com sucesso. Você receberá`,
          });
        }}
      />

      <DetalheModal item={detalhe} onClose={() => setDetalhe(null)} />

      <CelebrationOverlay
        open={celebrate.open}
        onClose={() => setCelebrate((c) => ({ ...c, open: false }))}
        amount={celebrate.amount}
        title={celebrate.title}
        subtitle={celebrate.subtitle}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
function SummaryCard({
  icon,
  label,
  value,
  hint,
  valueClass,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="sv-card-premium text-left p-5 flex items-center gap-4 hover:-translate-y-0.5 transition h-full min-h-[124px]"
    >
      <span className="shrink-0 grid place-items-center" style={{ width: 84, height: 84 }}>
        <img src={icon} alt="" width={80} height={80} style={{ width: 80, height: 80, objectFit: "contain" }} className="sv-icon-3d" />
      </span>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-sm font-bold text-[var(--sv-muted)] truncate">{label}</p>
        <p className={`text-3xl font-black tracking-tight tabular-nums truncate ${valueClass ?? "text-[var(--sv-purple)]"}`}>
          {value}
        </p>
        <p className="text-xs text-[var(--sv-muted)] mt-1 truncate">{hint}</p>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: StatusMov }) {
  if (status === "Disponível" || status === "Concluído") {
    return <span className="sv-badge-status sv-badge-gold">{status}</span>;
  }
  return <span className="sv-badge-status sv-badge-orange">{status}</span>;
}

/* ------------------------------------------------------------------ */
function SaldoModal({
  open,
  onClose,
  saldo,
  bloqueado,
}: {
  open: boolean;
  onClose: () => void;
  saldo: number;
  bloqueado: number;
}) {
  return (
    <PremiumModal
      open={open}
      onClose={onClose}
      icon={<img src={walletImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />}
      title="Saldo detalhado"
      description="Visão completa do seu saldo SmartVoz"
    >
      <div className="sv-card-balance p-5 space-y-3">
        <div className="flex justify-between text-[var(--sv-muted)]">
          <span>Saldo disponível</span>
          <span className="sv-text-green font-black text-2xl tabular-nums">{brl(saldo)}</span>
        </div>
        <div className="flex justify-between text-[var(--sv-muted)]">
          <span>Saldo bloqueado</span>
          <span className="text-[var(--sv-orange)] font-bold text-xl tabular-nums">{brl(bloqueado)}</span>
        </div>
        <div className="h-px bg-[var(--sv-lilac-border)]" />
        <div className="flex items-center justify-between">
          <span className="font-bold text-[var(--sv-purple-deep)]">Status</span>
          <span className="sv-badge-status sv-badge-gold">Disponível</span>
        </div>
      </div>
      <p className="sv-balance-mega tabular-nums text-center mt-5">{brl(saldo)}</p>
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="sv-btn-premium sv-btn-premium-tall">
          Fechar
        </button>
      </div>
    </PremiumModal>
  );
}

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
    return REDE_MOCK.filter(
      (u) => u.name.toLowerCase().includes(lower) || u.code.toLowerCase().includes(lower),
    );
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
      <div className="mb-5">
        <p className="font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Saldo disponível</p>
        <div className="sv-card-balance p-4 sm:p-5">
          <span className="sv-text-green font-black tabular-nums block text-2xl md:text-[30px]">
            {brl(balance)}
          </span>
        </div>
      </div>

      {step === "pick" && (
        <>
          <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Buscar usuário</label>
          <div className="relative">
            <img
              src={searchImg}
              alt=""
              width={32}
              height={32}
              style={{ width: 32, height: 32 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 sv-icon-3d pointer-events-none"
            />
            <input
              autoFocus
              className="sv-input-premium sv-search-field pl-14 pr-4"
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

          <div
            className="mt-5 flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "#FFF9E8", border: "1.5px solid var(--sv-gold)" }}
          >
            <img
              src={shieldImg}
              alt=""
              width={44}
              height={44}
              style={{ width: 44, height: 44 }}
              className="sv-icon-3d shrink-0"
            />
            <p className="text-sm font-semibold text-[var(--sv-purple-deep)] leading-snug self-center">
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
            <button onClick={close} className="sv-btn-ghost h-14 px-7 text-lg">
              Cancelar
            </button>
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
          <img
            src={transferImg}
            alt=""
            width={120}
            height={120}
            style={{ width: 120, height: 120 }}
            className="mx-auto sv-icon-3d animate-sv-premium-success"
          />
          <h3 className="mt-5 text-3xl font-extrabold text-[var(--sv-purple-deep)]">Transferência realizada!</h3>
          <p className="mt-3 sv-balance-mega tabular-nums">{brl(amt)}</p>
          <p className="mt-2 text-[var(--sv-muted)] text-lg">enviado para {selected?.name}.</p>
          <button onClick={close} className="sv-btn-premium sv-btn-premium-tall mt-7">
            Concluir
          </button>
        </div>
      )}
    </PremiumModal>
  );
}

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
  onConfirm: (amount: number, net: number, fee: number) => void;
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
      title="Solicitar Saque"
      description={done ? "Saque solicitado com sucesso" : "Preencha os dados abaixo para solicitar um saque"}
    >
      {!done ? (
        <>

          <div
            className="flex items-start gap-3 rounded-2xl p-4 mb-5"
            style={{ background: "#FFF9E8", border: "1.5px solid var(--sv-gold)" }}
          >
            <img
              src={infoImg}
              alt=""
              width={44}
              height={44}
              style={{ width: 44, height: 44 }}
              className="sv-icon-3d shrink-0"
            />
            <p className="text-sm font-semibold text-[var(--sv-purple-deep)] leading-snug self-center">
              Cada saque terá uma taxa de <b>3%</b> sobre o valor solicitado.
            </p>
          </div>

          <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-base md:text-lg">Valor do saque</label>
          <input
            autoFocus
            inputMode="decimal"
            className={`sv-input-premium h-14 text-2xl md:h-[72px] md:text-[32px] font-extrabold px-6 rounded-2xl ${amt > 0 ? "sv-glow-gold" : ""}`}
            placeholder="R$ 0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
          />
          {amt > balance && (
            <p className="mt-2 text-sm font-semibold text-[var(--sv-orange)] inline-flex items-center gap-2 animate-sv-shake">
              <AlertCircle className="size-4" /> Valor excede o saldo disponível.
            </p>
          )}

          <div className="sv-card-balance p-4 md:p-5 mt-4 md:mt-5 space-y-2 md:space-y-3">
            <div className="flex justify-between text-sm md:text-base text-[var(--sv-muted)]">
              <span>Valor solicitado:</span>
              <span className="tabular-nums font-semibold text-[var(--sv-purple-deep)]">{brl(amt)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base text-[var(--sv-muted)]">
              <span>Taxa (3%):</span>
              <span className="tabular-nums font-semibold text-[var(--sv-orange)]">− {brl(fee)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base text-[var(--sv-muted)]">
              <span className="inline-flex items-center gap-1">
                Saldo bloqueado
                <span className="text-[10px] md:text-xs text-[var(--sv-muted)]/80">(auto-débito)</span>
              </span>
              <span className="tabular-nums font-semibold text-[var(--sv-orange)]">− {brl(locked)}</span>
            </div>
            <div className="h-px bg-[var(--sv-lilac-border)]" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--sv-purple-deep)] text-sm md:text-lg">Valor líquido:</span>
              <span className="sv-text-green font-black tabular-nums text-2xl md:text-[40px]">
                {brl(net)}
              </span>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-3 mt-5 md:mt-7 sm:flex sm:justify-end">
            <button onClick={close} className="sv-btn-ghost h-10 md:h-12 w-full sm:w-auto px-5 md:px-7 text-sm md:text-base rounded-xl">
              Cancelar
            </button>
            <button
              disabled={!valid}
              onClick={() => {
                onConfirm(amt, net, fee);
                setDone(true);
              }}
              className="sv-btn-premium h-10 md:h-12 w-full sm:w-auto px-6 md:px-8 text-sm md:text-base rounded-xl"
            >
              Continuar
            </button>
          </div>
        </>
      ) : (
        <div className="py-8 text-center">
          <img
            src={piggyImg}
            alt=""
            width={130}
            height={130}
            style={{ width: 130, height: 130 }}
            className="mx-auto sv-icon-3d animate-sv-premium-success"
          />
          <h3 className="mt-5 text-3xl font-extrabold text-[var(--sv-purple-deep)]">Saque solicitado!</h3>
          <p className="mt-3 sv-balance-mega tabular-nums">{brl(net)}</p>
          <p className="mt-2 text-[var(--sv-muted)] text-lg">em processamento.</p>
          <button onClick={close} className="sv-btn-premium sv-btn-premium-tall mt-7">
            Concluir
          </button>
        </div>
      )}
    </PremiumModal>
  );
}

/* ------------------------------------------------------------------ */
function DetalheModal({ item, onClose }: { item: Movimento | null; onClose: () => void }) {
  return (
    <PremiumModal
      open={!!item}
      onClose={onClose}
      icon={item ? <img src={item.icone} alt="" width={72} height={72} style={{ width: 72, height: 72 }} /> : null}
      title={item?.titulo ?? ""}
      description={item?.categoria}
    >
      {item && (
        <>
          <div className="sv-card-balance p-5 space-y-3">
            <DetalheLinha label="Cliente" value={item.cliente} />
            <DetalheLinha label="Nível" value={item.nivel} />
            <DetalheLinha label="Data" value={item.data.toLocaleString("pt-BR")} />
            <DetalheLinha label="Tipo" value={item.tipo} />
            <DetalheLinha label="Status" value={<StatusBadge status={item.status} />} />
          </div>

          <p className="mt-5 text-[var(--sv-muted)] leading-relaxed">{item.descricao}</p>

          <p
            className={`mt-5 text-center font-black tabular-nums ${
              item.valor < 0 ? "text-[var(--sv-orange)]" : "sv-text-green"
            }`}
            style={{ fontSize: 44 }}
          >
            {item.valor < 0 ? "− " : ""}
            {brl(Math.abs(item.valor))}
          </p>

          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="sv-btn-premium sv-btn-premium-tall">
              Fechar
            </button>
          </div>
        </>
      )}
    </PremiumModal>
  );
}

function DetalheLinha({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--sv-muted)]">{label}</span>
      <span className="font-bold text-[var(--sv-purple-deep)]">{value}</span>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-[var(--sv-muted)]">
        <img
          src={icon}
          alt=""
          width={36}
          height={36}
          style={{ width: 36, height: 36 }}
          className="sv-icon-3d shrink-0"
        />
        {label}
      </div>
      {value}
    </div>
  );
}
