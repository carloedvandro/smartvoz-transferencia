import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTransactions } from "@/lib/wallet.functions";
import { TransactionsTable } from "@/components/premium/TransactionsTable";
import { EmptyState } from "@/components/premium/EmptyState";
import receiptImg from "@/assets/receipt-3d.png";
import { brl, brDate } from "@/lib/format";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileText, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/extrato")({
  head: () => ({
    meta: [
      { title: "Extrato Financeiro Premium — SmartVoz" },
      { name: "description", content: "Histórico completo de movimentações com filtros, busca e exportação CSV/PDF." },
    ],
  }),
  component: ExtratoPage,
});

const PAGE_SIZE = 10;

function ExtratoPage() {
  const lFn = useServerFn(listTransactions);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "completed" | "failed">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const data = useQuery({
    queryKey: ["tx", { page, search, status, dateFrom, dateTo }],
    queryFn: () =>
      lFn({
        data: {
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          status,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      }),
  });

  const total = data.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function exportCSV() {
    const rows = (data.data?.rows ?? []).map((r: any) => ({
      Data: brDate(r.created_at),
      Tipo: r.type,
      Descrição: r.description ?? r.counterpart_name ?? "",
      Valor: r.amount,
      Taxa: r.fee,
      Líquido: r.net_amount,
      Status: r.status,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extrato-smartvoz-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(33, 0, 75);
    doc.text("Extrato Financeiro SmartVoz", 14, 18);
    autoTable(doc, {
      startY: 26,
      head: [["Data", "Tipo", "Descrição", "Valor", "Taxa", "Status"]],
      body: (data.data?.rows ?? []).map((r: any) => [
        brDate(r.created_at),
        r.type,
        r.description ?? r.counterpart_name ?? "",
        brl(r.amount),
        brl(r.fee),
        r.status,
      ]),
      headStyles: { fillColor: [106, 13, 173] },
    });
    doc.save(`extrato-smartvoz-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-8 animate-sv-fade-up">
      <header className="flex items-center gap-4">
        <img src={receiptImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--sv-purple-deep)]">
            Extrato Financeiro Premium
          </h1>
          <p className="text-[var(--sv-muted)] text-lg">Histórico completo com filtros e exportações</p>
        </div>
      </header>

      <section className="sv-card-premium p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--sv-muted)]" />
            <input
              className="sv-input-premium h-12 pl-11 pr-4 text-base"
              placeholder="Buscar por descrição ou nome…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="sv-input-premium h-12 px-4 text-base"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="all">Todos os status</option>
            <option value="completed">Concluídos</option>
            <option value="pending">Pendentes</option>
            <option value="failed">Falhos</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="sv-input-premium h-12 px-3 text-sm"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
            <input
              type="date"
              className="sv-input-premium h-12 px-3 text-sm"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={exportCSV} className="sv-btn-ghost h-11 px-5 inline-flex items-center gap-2 text-sm">
            <Download className="size-4" /> Exportar CSV
          </button>
          <button onClick={exportPDF} className="sv-btn-ghost h-11 px-5 inline-flex items-center gap-2 text-sm">
            <FileText className="size-4" /> Exportar PDF
          </button>
        </div>
      </section>

      {data.isLoading ? (
        <p className="text-[var(--sv-muted)] py-12 text-center">Carregando…</p>
      ) : (data.data?.rows.length ?? 0) > 0 ? (
        <>
          <TransactionsTable rows={data.data!.rows as any} />
          <div className="flex items-center justify-between text-sm text-[var(--sv-muted)]">
            <span>
              Página {page} de {pages} · {total} registros
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="sv-btn-ghost h-10 px-4 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="sv-btn-ghost h-10 px-4 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="sv-card-premium p-6">
          <EmptyState message="Nenhuma movimentação encontrada com esses filtros." variant="receipt" />
        </div>
      )}
    </div>
  );
}
