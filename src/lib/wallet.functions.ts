import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wallets")
      .select("balance_available, balance_locked, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { balance_available: 0, balance_locked: 0, updated_at: null };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const searchInput = z.object({ q: z.string().trim().min(1).max(100) });
export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("search_users", { p_query: data.q });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const transferInput = z.object({
  toUserId: z.string().uuid(),
  amount: z.number().positive().max(1_000_000),
});
export const transfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => transferInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("transfer_funds", {
      p_to_user: data.toUserId,
      p_amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const withdrawalInput = z.object({ amount: z.number().min(50).max(1_000_000) });
export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => withdrawalInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: res, error } = await context.supabase.rpc("request_withdrawal", { p_amount: data.amount });
    if (error) throw new Error(error.message);
    return res as { ok: boolean; id: string; fee: number; net: number };
  });

const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  status: z.enum(["all", "pending", "completed", "failed"]).default("all"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const listTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("transactions")
      .select("id, type, amount, fee, net_amount, status, counterpart_name, description, created_at", {
        count: "exact",
      })
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.dateFrom) q = q.gte("created_at", data.dateFrom);
    if (data.dateTo) q = q.lte("created_at", data.dateTo);
    if (data.search) q = q.or(`description.ilike.%${data.search}%,counterpart_name.ilike.%${data.search}%`);
    const { data: rows, count, error } = await q.range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const listWithdrawals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listInput.parse(d))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let q = context.supabase
      .from("withdrawal_requests")
      .select("id, amount, fee, net_amount, status, created_at, processed_at", { count: "exact" })
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.dateFrom) q = q.gte("created_at", data.dateFrom);
    if (data.dateTo) q = q.lte("created_at", data.dateTo);
    const { data: rows, count, error } = await q.range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });
