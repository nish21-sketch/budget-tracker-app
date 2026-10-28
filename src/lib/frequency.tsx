import { monthLabel } from "@/lib/utils";

export type Frequency = "monthly" | "quarterly" | "half_yearly" | "yearly";

export const FREQUENCY_OPTIONS: { value: Frequency; label: string; tag: string }[] = [
  { value: "monthly", label: "Every month", tag: "" },
  { value: "quarterly", label: "Every 3 months", tag: "every 3 months" },
  { value: "half_yearly", label: "Every 6 months", tag: "every 6 months" },
  { value: "yearly", label: "Every year", tag: "yearly" },
];

export function intervalMonths(frequency?: string | null): number {
  if (frequency === "quarterly") return 3;
  if (frequency === "half_yearly") return 6;
  if (frequency === "yearly") return 12;
  return 1;
}

export function frequencyTag(frequency?: string | null): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.tag ?? "";
}

// True if the category's full amount counts in this month.
export function isDueInMonth(
  frequency: string | null | undefined,
  dueMonth: string | null | undefined,
  month: Date
): boolean {
  const interval = intervalMonths(frequency);
  if (interval === 1 || !dueMonth) return true;
  const [y, m] = dueMonth.split("-").map(Number);
  if (!y || !m) return true;
  const diff = (month.getFullYear() - y) * 12 + (month.getMonth() - (m - 1));
  return ((diff % interval) + interval) % interval === 0;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function defaultDueMonth(): string {
  const now = new Date();
  return monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

// The next 12 months, as choices for "First due".
export function dueMonthOptions(selected?: string | null): { value: string; label: string }[] {
  const base = new Date();
  const list: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    list.push({ value: monthKey(d), label: monthLabel(d) });
  }
  if (selected && !list.some((o) => o.value === selected)) {
    const [y, m] = selected.split("-").map(Number);
    if (y && m) list.unshift({ value: selected, label: monthLabel(new Date(y, m - 1, 1)) });
  }
  return list;
}