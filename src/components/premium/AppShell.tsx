import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Wallet as WalletIcon, ArrowLeftRight, Receipt, Home } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/", label: "Início", icon: Home },
  { to: "/extrato", label: "Extrato", icon: Receipt },
  { to: "/transferencia", label: "Transferência", icon: ArrowLeftRight },
  { to: "/saques", label: "Saques", icon: WalletIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#FAF7FF 100%)" }}>
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-[var(--sv-lilac-border)]">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="size-9 rounded-xl grid place-items-center text-white font-extrabold shadow-md"
              style={{ background: "var(--gradient-purple-3d)", border: "1.5px solid var(--sv-gold)" }}
            >
              S
            </div>
            <span className="font-extrabold text-[var(--sv-purple-deep)] text-lg tracking-tight">SmartVoz</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-4 h-10 rounded-full inline-flex items-center gap-2 font-semibold text-sm transition ${
                    active
                      ? "bg-[var(--sv-lilac)] text-[var(--sv-purple-deep)] border border-[var(--sv-lilac-border)]"
                      : "text-[var(--sv-muted)] hover:text-[var(--sv-purple-deep)] hover:bg-[var(--sv-lilac)]/60"
                  }`}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex-1" />
          <button
            onClick={signOut}
            className="sv-btn-ghost inline-flex items-center gap-2 h-10 px-4 text-sm"
            aria-label="Sair"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
        <nav className="md:hidden flex items-center gap-1 px-3 pb-3 overflow-x-auto">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`shrink-0 px-3 h-9 rounded-full inline-flex items-center gap-1.5 font-semibold text-xs transition ${
                  active
                    ? "bg-[var(--sv-lilac)] text-[var(--sv-purple-deep)] border border-[var(--sv-lilac-border)]"
                    : "text-[var(--sv-muted)] bg-white border border-transparent"
                }`}
              >
                <Icon className="size-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">{children}</main>
    </div>
  );
}
