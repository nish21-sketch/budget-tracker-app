import { createClient } from "@/lib/supabase/server";
import { firstOfMonth, toDateInputValue } from "@/lib/utils";

export type Category = {
  id: string;
  name: string;
  type: "Fixed Deduction" | "Fluid Essential" | "Personal" | "Investment";
  ideal_plan_amount: number;
  end_date: string | null;
  sort_order: number;
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

// Sum of transactions per category for a given first-of-month date
export async function getSoFarByCategory(month: Date = firstOfMonth()): Promise<Record<string, number>> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return {};
  const { data } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", user.id)
    .eq("month", toDateInputValue(month));

  const map: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    map[row.category_id] = (map[row.category_id] ?? 0) + Number(row.amount);
  });
  return map;
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
