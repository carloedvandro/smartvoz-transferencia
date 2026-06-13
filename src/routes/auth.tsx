import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import walletImg from "@/assets/wallet-3d.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — SmartVoz Wallet" },
      { name: "description", content: "Acesse sua carteira SmartVoz: extrato premium, transferências e saques." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email se necessário.");
        navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Falha no login com Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div
      className="min-h-screen grid place-items-center px-5"
      style={{ background: "linear-gradient(180deg,#FAF7FF 0%,#FFFFFF 60%)" }}
    >
      <div className="sv-card-premium w-full max-w-[460px] p-8 md:p-10 animate-sv-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <img src={walletImg} alt="" width={64} height={64} style={{ width: 64, height: 64 }} />
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--sv-purple-deep)] leading-tight">SmartVoz Wallet</h1>
            <p className="text-sm text-[var(--sv-muted)]">{mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={google}
          disabled={loading}
          className="sv-btn-ghost w-full h-12 inline-flex items-center justify-center gap-3 mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          <span className="font-semibold">Continuar com Google</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-[var(--sv-lilac-border)]" />
          <span className="text-xs text-[var(--sv-muted)] font-semibold">OU</span>
          <div className="h-px flex-1 bg-[var(--sv-lilac-border)]" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              className="sv-input-premium h-12 px-4 text-base"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="sv-input-premium h-12 px-4 text-base"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="sv-input-premium h-12 px-4 text-base"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" disabled={loading} className="sv-btn-premium w-full h-12 text-base">
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--sv-muted)] mt-5">
          {mode === "signin" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-[var(--sv-purple)] font-bold hover:underline"
          >
            {mode === "signin" ? "Cadastre-se" : "Entrar"}
          </button>
        </p>

        <p className="text-center text-xs text-[var(--sv-muted)] mt-6">
          <Link to="/" className="hover:underline">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
