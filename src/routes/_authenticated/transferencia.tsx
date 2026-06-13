import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWallet, searchUsers, transfer } from "@/lib/wallet.functions";
import { BalanceCard } from "@/components/premium/BalanceCard";
import { PremiumModal } from "@/components/premium/PremiumModal";
import transferImg from "@/assets/transfer-3d.png";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { Search, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transferencia")({
  head: () => ({
    meta: [
      { title: "Transferência — SmartVoz Wallet" },
      { name: "description", content: "Envie valores para outros usuários SmartVoz com segurança." },
    ],
  }),
  component: TransferPage,
});

type UserRow = { id: string; username: string; display_name: string; avatar_url: string | null };

function TransferPage() {
  const qc = useQueryClient();
  const wFn = useServerFn(getWallet);
  const sFn = useServerFn(searchUsers);
  const tFn = useServerFn(transfer);

  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => wFn() });
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [amount, setAmount] = useState("");

  const search = useQuery({
    queryKey: ["search", q],
    queryFn: () => sFn({ data: { q } }),
    enabled: q.trim().length >= 2,
  });

  const mutate = useMutation({
    mutationFn: (vars: { toUserId: string; amount: number }) => tFn({ data: vars }),
    onSuccess: () => {
      toast.success("Transferência concluída!");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["tx"] });
      setOpen(false);
      setSelected(null);
      setAmount("");
      setQ("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha"),
  });

  const balance = Number(wallet.data?.balance_available ?? 0);
  const amt = Number(amount.replace(",", "."));
  const valid = selected && amt > 0 && amt <= balance;

  return (
    <div className="space-y-8 animate-sv-fade-up">
      <header className="flex items-center gap-4">
        <img src={transferImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--sv-purple-deep)]">Transferência</h1>
          <p className="text-[var(--sv-muted)] text-lg">Envie valores para outros usuários SmartVoz</p>
        </div>
      </header>

      <BalanceCard size="lg" value={balance} />

      <button onClick={() => setOpen(true)} className="sv-btn-premium h-[72px] px-10 text-xl">
        Nova transferência
      </button>

      <PremiumModal
        open={open}
        onClose={() => setOpen(false)}
        icon={<img src={transferImg} alt="" width={72} height={72} style={{ width: 72, height: 72 }} />}
        title="Nova transferência"
        description="Busque o destinatário e informe o valor que deseja enviar."
      >
        <div className="space-y-6">
          <BalanceCard label="Seu saldo disponível" value={balance} />

          <div>
            <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Buscar usuário</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-[var(--sv-muted)]" />
              <input
                className="sv-input-premium pl-14 pr-6"
                style={{ height: 72, fontSize: 22 }}
                placeholder="Nome ou @usuário"
                value={selected ? selected.display_name : q}
                onChange={(e) => {
                  setSelected(null);
                  setQ(e.target.value);
                }}
              />
            </div>
            {!selected && q.trim().length >= 2 && (
              <ul className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-[var(--sv-lilac-border)] bg-white">
                {(search.data ?? []).map((u: UserRow) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(u);
                        setQ("");
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-[var(--sv-lilac)] flex items-center gap-3"
                    >
                      <span
                        className="size-10 rounded-full grid place-items-center text-white font-bold"
                        style={{ background: "var(--gradient-purple-3d)" }}
                      >
                        {u.display_name.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <span className="block font-semibold text-[var(--sv-purple-deep)]">{u.display_name}</span>
                        <span className="block text-xs text-[var(--sv-muted)]">@{u.username}</span>
                      </span>
                    </button>
                  </li>
                ))}
                {search.data && search.data.length === 0 && (
                  <li className="px-5 py-3 text-sm text-[var(--sv-muted)]">Nenhum usuário encontrado.</li>
                )}
              </ul>
            )}
          </div>

          {selected && (
            <div className="flex items-center gap-3 sv-card-balance" style={{ padding: 16 }}>
              <User className="size-5 text-[var(--sv-purple)]" />
              <span className="font-semibold text-[var(--sv-purple-deep)]">
                Para: {selected.display_name} <span className="text-[var(--sv-muted)] font-normal">@{selected.username}</span>
              </span>
            </div>
          )}

          <div>
            <label className="block font-bold text-[var(--sv-purple-deep)] mb-2 text-lg">Valor</label>
            <input
              inputMode="decimal"
              className="sv-input-premium"
              style={{ height: 84, fontSize: 36, fontWeight: 700, paddingLeft: 24, paddingRight: 24, borderRadius: 24 }}
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            />
            {amt > balance && <p className="text-[var(--sv-orange)] text-sm mt-2 font-semibold">Saldo insuficiente.</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="sv-btn-ghost" style={{ height: 72, padding: "0 36px", fontSize: 22 }}>
              Cancelar
            </button>
            <button
              disabled={!valid || mutate.isPending}
              onClick={() => selected && mutate.mutate({ toUserId: selected.id, amount: amt })}
              className="sv-btn-premium"
              style={{ height: 72, padding: "0 42px", fontSize: 24 }}
            >
              {mutate.isPending ? "Enviando…" : `Transferir ${amt > 0 ? brl(amt) : ""}`}
            </button>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
