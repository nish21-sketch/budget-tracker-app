"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data";
import { firstOfMonth, toDateInputValue } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OnboardingCategory = {
  name: string;
  type: "Fixed Deduction" | "Fluid Essential" | "Personal" | "Investment";
  idealPlanAmount: number;
  endDate: string | null;
};

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

  const rows = categories.map((c, i) => ({
    user_id: user!.id,
    name: c.name,
    type: c.type,
    ideal_plan_amount: c.idealPlanAmount,
    end_date: c.endDate || null,
    sort_order: i,
  }));
  if (rows.length > 0) {
    await supabase.from("categories").insert(rows);
  }

  redirect("/dashboard");
}

export async function logTransaction(categoryId: string, amount: number, month?: Date) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await supabase.from("transactions").insert({
    user_id: user!.id,
    category_id: categoryId,
    amount,
    month: toDateInputValue(month ?? firstOfMonth()),
  });

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
  fields: { name: string; type: string; idealPlanAmount: number; endDate: string | null }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (id) {
    await supabase
      .from("categories")
      .update({
        name: fields.name,
        type: fields.type,
        ideal_plan_amount: fields.idealPlanAmount,
        end_date: fields.endDate || null,
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
