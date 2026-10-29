import { createClient } from "@/lib/supabase/server";
import { firstOfMonth, toDateInputValue } from "@/lib/utils";

export type Category = {
  id: string;
  name: string;
  type: "Fixed Deduction" | "Fluid Essential" | "Personal" | "Investment";
  ideal_plan_amount: number;
  end_date: string | null;
  sort_order: number;
  frequency?: "monthly" | "quarterly" | "half_yearly" | "yearly";
  due_month?: string | null;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getProfile() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

// The cycle the user is in, and the day it actually began.
// Normally the calendar month, starting on the 1st. If the user started the next cycle early,
// the cycle is that month and it began on the day they tapped Start.
export async function getActiveCycleStart(): Promise<{ cycle: Date; start: Date }> {
  const calendar = firstOfMonth();
  const profile = (await getProfile()) as
    | { current_cycle?: string | null; cycle_started_on?: string | null }
    | null;
  const raw = profile?.current_cycle;
  if (!raw) return { cycle: calendar, start: calendar };
  const [y, m] = raw.split("-").map(Number);
  if (!y || !m) return { cycle: calendar, start: calendar };
  const stored = new Date(y, m - 1, 1);
  if (stored < calendar) return { cycle: calendar, start: calendar };
  let start = stored;
  const s = profile?.cycle_started_on;
  if (s) {
    const [sy, sm, sd] = s.split("-").map(Number);
    if (sy && sm && sd) start = new Date(sy, sm - 1, sd);
  }
  return { cycle: stored, start };
}

export async function getActiveCycle(): Promise<Date> {
  return (await getActiveCycleStart()).cycle;
}

export async function getIncome() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return 0;
  const { data } = await supabase
    .from("income")
    .select("monthly_amount")
    .eq("user_id", user.id)
    .single();
  return data?.monthly_amount ?? 0;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");
  return data ?? [];
}

// Sum of transactions per category for a cycle (defaults to the active cycle)
export async function getSoFarByCategory(month?: Date): Promise<Record<string, number>> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return {};
  const target = month ?? (await getActiveCycle());
  const { data } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("month", toDateInputValue(target));
  const map: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    map[row.category_id] = (map[row.category_id] ?? 0) + Number(row.amount);
  });
  return map;
}

// Spend per category across a window of cycles [from, toExclusive),
// plus how many of those cycles had any spending at all.
export async function getCategoryHistory(
  from: Date,
  toExclusive: Date
): Promise<{ totals: Record<string, number>; monthCount: number }> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { totals: {}, monthCount: 0 };
  const { data } = await supabase
    .from("transactions")
    .select("category_id, amount, month")
    .eq("user_id", user.id)
    .gte("month", toDateInputValue(from))
    .lt("month", toDateInputValue(toExclusive));
  const totals: Record<string, number> = {};
  const months = new Set<string>();
  (data ?? []).forEach((row) => {
    totals[row.category_id] = (totals[row.category_id] ?? 0) + Number(row.amount);
    months.add(String(row.month));
  });
  return { totals, monthCount: months.size };
}

// Total non-Investment spend per cycle, keyed by first-of-month date (YYYY-MM-DD)
export async function getMonthlySpendTotals(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return {};
  const { data } = await supabase
    .from("transactions")
    .select("amount, month, categories(type)")
    .eq("user_id", user.id);
  const totals: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const raw = row.categories as unknown as { type: string } | { type: string }[] | null;
    const cat = Array.isArray(raw) ? raw[0] : raw;
    if (!cat || cat.type === "Investment") return;
    totals[row.month] = (totals[row.month] ?? 0) + Number(row.amount);
  });
  return totals;
}

export async function getAllTransactions() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("transactions")
    .select("id, amount, month, note, logged_at, categories(name)")
    .eq("user_id", user.id)
    .order("month", { ascending: false })
    .order("logged_at", { ascending: false });
  return data ?? [];
}

export async function getRecentTransactions(limit = 10) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return [];
  const { data } = await supabase
    .from("transactions")
    .select("id, amount, note, logged_at, category_id, categories(name)")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}