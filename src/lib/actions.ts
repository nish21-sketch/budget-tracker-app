"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getActiveCycle } from "@/lib/data";
import { firstOfMonth, addMonths, monthLabel, toDateInputValue } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OnboardingCategory = {
  name: string;
  type: "Fixed Deduction" | "Fluid Essential" | "Personal" | "Investment";
  idealPlanAmount: number;
  endDate: string | null;
  frequency?: string;
  dueMonth?: string | null;
};

const FREQUENCIES = ["monthly", "quarterly", "half_yearly", "yearly"];

function cleanFrequency(f?: string | null): string {
  return f && FREQUENCIES.includes(f) ? f : "monthly";
}

export async function completeOnboarding(
  currency: string,
  monthlyIncome: number,
  categories: OnboardingCategory[]
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await supabase.from("profiles").update({ currency, onboarding_complete: true }).eq("id", user!.id);
  await supabase.from("income").update({ monthly_amount: monthlyIncome }).eq("user_id", user!.id);
  const rows = categories.map((c, i) => {
    const freq = cleanFrequency(c.frequency);
    return {
      user_id: user!.id,
      name: c.name,
      type: c.type,
      ideal_plan_amount: c.idealPlanAmount,
      end_date: c.endDate || null,
      frequency: freq,
      due_month: freq === "monthly" ? null : c.dueMonth || null,
      sort_order: i,
    };
  });
  if (rows.length > 0) {
    await supabase.from("categories").insert(rows);
  }
  redirect("/dashboard");
}

export async function getCycleInfo() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const calendar = firstOfMonth();
  const active = await getActiveCycle();
  const next = addMonths(active, 1);
  const { data } = await supabase
    .from("transactions")
    .select("month")
    .eq("user_id", user.id)
    .lt("month", toDateInputValue(active));
  const keys = Array.from(new Set((data ?? []).map((r) => String(r.month))))
    .sort()
    .reverse()
    .slice(0, 12);
  return {
    activeLabel: monthLabel(active),
    nextLabel: monthLabel(next),
    backLabel: monthLabel(addMonths(active, -1)),
    canStartNext: next <= addMonths(calendar, 1),
    startedEarly: active > calendar,
    past: keys.map((k) => {
      const [y, m] = k.split("-").map(Number);
      return { key: k, label: monthLabel(new Date(y, m - 1, 1)) };
    }),
  };
}

export async function startNextCycle() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const active = await getActiveCycle();
  const next = addMonths(active, 1);
  if (next > addMonths(firstOfMonth(), 1)) return;
  await supabase.from("profiles").update({ current_cycle: toDateInputValue(next) }).eq("id", user!.id);
  // Saved separately so the cycle still starts even if this column hasn't been added yet
  await supabase.from("profiles").update({ cycle_started_on: toDateInputValue(new Date()) }).eq("id", user!.id);
  revalidatePath("/", "layout");
}

export async function undoEarlyCycle() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const active = await getActiveCycle();
  if (active <= firstOfMonth()) return;
  await supabase.from("profiles").update({ current_cycle: null }).eq("id", user!.id);
  await supabase.from("profiles").update({ cycle_started_on: null }).eq("id", user!.id);
  revalidatePath("/", "layout");
}

export async function logTransaction(categoryId: string, amount: number, note?: string, month?: Date) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const cycle = month ?? (await getActiveCycle());
  const { data } = await supabase
    .from("transactions")
    .insert({
      user_id: user!.id,
      category_id: categoryId,
      amount,
      note: note || null,
      month: toDateInputValue(cycle),
    })
    .select("id, amount, note, logged_at, category_id")
    .single();
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/planned");
  revalidatePath("/historic");
  return data;
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await supabase.from("transactions").delete().eq("id", id).eq("user_id", user!.id);
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/planned");
  revalidatePath("/historic");
}

export async function updateIncome(amount: number) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await supabase.from("income").update({ monthly_amount: amount }).eq("user_id", user!.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/planned");
}

export async function upsertCategory(
  id: string | null,
  fields: {
    name: string;
    type: string;
    idealPlanAmount: number;
    endDate: string | null;
    frequency?: string;
    dueMonth?: string | null;
  }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const freq = cleanFrequency(fields.frequency);
  const dueMonth = freq === "monthly" ? null : fields.dueMonth || null;
  if (id) {
    await supabase
      .from("categories")
      .update({
        name: fields.name,
        type: fields.type,
        ideal_plan_amount: fields.idealPlanAmount,
        end_date: fields.endDate || null,
        frequency: freq,
        due_month: dueMonth,
      })
      .eq("id", id)
      .eq("user_id", user!.id);
  } else {
    await supabase.from("categories").insert({
      user_id: user!.id,
      name: fields.name,
      type: fields.type,
      ideal_plan_amount: fields.idealPlanAmount,
      end_date: fields.endDate || null,
      frequency: freq,
      due_month: dueMonth,
      sort_order: 999,
    });
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/planned");
  revalidatePath("/log");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await supabase.from("categories").delete().eq("id", id).eq("user_id", user!.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/planned");
  revalidatePath("/log");
}

export async function moveCategory(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { data: cats } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("user_id", user!.id)
    .order("sort_order");
  if (!cats) return;
  const idx = cats.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= cats.length) return;
  const a = cats[idx];
  const b = cats[swapIdx];
  await supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id);
  await supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/planned");
  revalidatePath("/log");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}