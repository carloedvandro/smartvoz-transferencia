
# SmartVoz Wallet Premium — Plano de Construção

App de carteira digital com identidade visual roxo SmartVoz + dourado metálico, profundidade 3D e cantos arredondados. Inclui Extrato Financeiro Premium (referência visual), Transferência entre usuários e Solicitação de Saque, todos com o mesmo padrão.

## 1. Infraestrutura

- Ativar **Lovable Cloud** (auth + Postgres + server functions).
- Autenticação por **email/senha + Google**.
- Tabela `profiles` (auto-criada por trigger no signup): id, username, display_name, avatar_url.
- Tabela `wallets`: user_id, balance_available (numeric), balance_locked (numeric).
- Tabela `transactions`: id, user_id, type ('transfer_in' | 'transfer_out' | 'withdrawal' | 'deposit'), amount, fee, net_amount, status ('pending' | 'completed' | 'failed'), counterpart_user_id, description, created_at.
- Tabela `withdrawal_requests`: id, user_id, amount, fee (3%), net_amount, status, created_at, processed_at.
- RLS: cada usuário só lê/escreve seu próprio wallet/transactions/withdrawals.
- Server functions (`createServerFn` + `requireSupabaseAuth`):
  - `searchUsers(query)` — autocomplete
  - `transfer({ toUserId, amount })` — valida saldo, debita, credita, registra 2 transactions atômicas
  - `requestWithdrawal({ amount })` — valida mínimo (R$ 50), aplica taxa 3%, debita disponível, registra
  - `listTransactions({ page, search, dateFrom, dateTo, status })` — paginado + filtros
  - `listWithdrawals({ page, ... })`

## 2. Rotas (TanStack Start)

```
/auth                       — login/signup
/_authenticated/
  ├─ index.tsx              — dashboard (saldo + ações rápidas)
  ├─ extrato.tsx            — Extrato Financeiro Premium (referência visual mestre)
  ├─ transferencia.tsx      — tela + modal de transferência
  └─ saques.tsx             — tela de saques + modal solicitar saque
```

## 3. Design System (src/styles.css)

Tokens adicionados em `@theme`:
- `--color-smartvoz-purple-deep: #21004B`
- `--color-smartvoz-purple: #6A0DAD`
- `--color-smartvoz-purple-light: #B84CFF`
- `--color-smartvoz-gold: #F6C756`
- `--color-smartvoz-green: #00D97E`
- `--color-smartvoz-green-deep: #009D59`
- `--color-smartvoz-orange: #FF5A1F`
- `--color-surface-lilac: #FAF7FF`
- `--color-border-lilac: #E9DDF8`
- `--color-muted-blue: #5D6B82`
- Gradientes: `--gradient-purple-3d`, `--gradient-green-value`, `--gradient-gold-shine`
- Sombras: `--shadow-premium`, `--shadow-purple-glow`, `--shadow-gold-glow`

Variantes de Button: `premium` (roxo 3D com borda dourada) e `premium-ghost` (cancelar branco).

## 4. Componentes-chave

- `<PremiumModal>` — container 32px radius, sombra dupla, `animate-scale-in` (0.95 → 1, 250ms).
- `<BalanceCard>` — fundo lilás, valor gigante com gradiente verde clip-text.
- `<PremiumInput>` — 72px / 22px, borda lilás, hover roxo + glow.
- `<AmountInput>` — 84px / 36px / peso 700.
- `<Wallet3DIcon>` / `<Piggy3DIcon>` — gerados via imagegen (PNG transparente, carteira/cofrinho roxo com moldura dourada e reflexo).
- `<WithdrawalSuccessFX>` — explosão dourada + moedas + partículas roxas (~1200ms, CSS keyframes + lib `canvas-confetti` para moedas).
- `<EmptyState>` — ícone 3D centralizado 120px @ 50% opacidade + mensagem.
- `<TransactionsTable>` — paginação, busca, filtro data, filtro status, exportar CSV (`papaparse`) e PDF (`jspdf` + `jspdf-autotable`).

## 5. Fluxos

**Transferência:** buscar usuário (autocomplete) → selecionar → digitar valor → validar saldo client+server → confirmar → registra histórico → toast + atualiza saldo.

**Saque:** validar mínimo → mostrar `valor digitado`, `taxa 3%`, `líquido a receber` em destaque → confirmar → animação de sucesso → registra → atualiza saldo.

**Extrato:** lista paginada de todas as transactions com filtros e exportações.

## 6. Animações

- Modais: `scale-in` 250ms.
- Botões premium: hover lift + brilho dourado.
- Sucesso saque: confete dourado + shake leve no botão (1200ms).
- Listas: `fade-in` stagger.

## 7. Detalhes técnicos importantes

- Transferência feita em RPC Postgres (`SECURITY DEFINER`) para garantir atomicidade: débito + crédito + 2 inserts em transação única; verifica saldo dentro da função.
- Taxa de saque calculada server-side (não confiar no cliente).
- Validações Zod em todas as server fns (min/max, formato).
- Exportação CSV/PDF feita client-side a partir dos dados já carregados (limite razoável).
- Imagens 3D (carteira, cofrinho, moedas) geradas com `imagegen` em PNG transparente, importadas como assets.

## 8. Itens fora do escopo nesta entrega

- Som no sucesso do saque (citado como opcional; pulo por padrão para não exigir asset extra).
- Processamento real do saque (status fica `pending` — administração manual).

---

Ao aprovar, eu ativo o Cloud, crio o schema, gero os ícones 3D, monto o design system e construo as 4 telas + modais nesta ordem: design system → auth → extrato (referência) → transferência → saques.
