import Link from "next/link";
import {
  getCategories,
  getSoFarByCategory,
  getIncome,
  getProfile,
  getMonthlySpendTotals,
  getActiveCycle,
  getCategoryMonthTotals,
} from "@/lib/data";
import { addMonths, fmt, toDateInputValue } from "@/lib/utils";
import PlannedTable from "./PlannedTable";
import BudgetCheck from "./BudgetCheck";
import type { Suggestion } from "./BudgetCheck";

const PAST_MONTHS = 2;
const FUTURE_MONTHS = 12;
const PATTERN_MONTHS = 3;
const FLEX_TYPES: string[] = ["Fluid Essential", "Personal"];

function tidy(n: number): number {
  return n >= 500 ? Math.round(n / 50) * 50 : Math.round(n / 10) * 10;
}

function median3(a: number, b: number, c: number): number {
  return [a, b, c].sort((x, y) => x - y)[1];
}

export default async function PlannedPage() {
  const now = await getActiveCycle();

  const [categories, soFarMap, income, profile, monthTotals, actuals] = await Promise.all([
    getCategories(),
    getSoFarByCategory(now),
    getIncome(),
    getProfile(),
    getMonthlySpendTotals(),
    getCategoryMonthTotals(addMonths(now, -PATTERN_MONTHS), now),
  ]);

  const currency = profile?.currency ?? "₹";
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));

  const months = Array.from({ length: PAST_MONTHS + 1 + FUTURE_MONTHS }, (_, i) =>
    addMonths(now, i - PAST_MONTHS)
  );
  const monthsIso = months.map((m) => m.toISOString());

  const currentKey = toDateInputValue(now);
  const completed = Object.entries(monthTotals)
    .filter(([k]) => k < currentKey)
    .map(([, v]) => v);
  const avgMonthlySpend =
    completed.length > 0
      ? completed.reduce((a, b) => a + b, 0) / completed.length
      : monthTotals[currentKey] ?? 0;
  const avgSub =
    completed.length > 0
      ? `avg of ${completed.length} month${completed.length === 1 ? "" : "s"}`
      : "this cycle so far";

  // "Your pattern": needs logs in each of the last 3 months
  const patternKeys = [1, 2, 3].map((k) => toDateInputValue(addMonths(now, -k)));
  const patternReady = patternKeys.every((k) => !!actuals[k]);

  const patternAvg: Record<string, number> = {};
  const suggestions: Suggestion[] = [];

  if (patternReady) {
    for (const c of categories) {
      if (!FLEX_TYPES.includes(c.type)) continue;
      if ((c.frequency ?? "monthly") !== "monthly") continue;

      const v = patternKeys.map((k) => actuals[k]?.[c.id] ?? 0);
      const usual = Math.round(median3(v[0], v[1], v[2]));
      patternAvg[c.id] = usual;

      if (c.end_date || usual <= 0) continue;
      const plan = Number(c.ideal_plan_amount);
      const diff = Math.abs(usual - plan);
      const pct = plan > 0 ? diff / plan : 1;
      const suggested = tidy(usual);
      if (pct >= 0.2 && suggested !== plan) {
        suggestions.push({ id: c.id, name: c.name, plan, usual, suggested });
      }
    }
    suggestions.sort(
      (a, b) => Math.abs(b.suggested - b.plan) - Math.abs(a.suggested - a.plan)
    );
  }

  return (
    <div>
      <h2 style={{ margin: "4px 0 8px", fontSize: 18 }}>Future Estimate</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div className="card" style={{ padding: "8px 12px", marginBottom: 0, borderLeft: "4px solid #d97706" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Avg Monthly Spend</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(Math.round(avgMonthlySpend), currency)}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{avgSub}</div>
        </div>
        <Link
          href="/historic"
          className="card"
          style={{ padding: "8px 12px", marginBottom: 0, textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div style={{ fontSize: 11, color: "#6b7280" }}>History</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>Historic →</div>
        </Link>
      </div>

      {patternReady && <BudgetCheck suggestions={suggestions} currency={currency} />}

      <div className="legend-row">
        <span><span className="legend-dot" style={{ background: "#e5e7eb" }} /> Past months (what you spent)</span>
        <span><span className="legend-dot" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }} /> Current cycle (actual so far)</span>
        <span><span className="legend-dot" style={{ background: "var(--red-soft)", border: "1px solid var(--red)" }} /> Over plan</span>
        <span><span className="legend-dot" style={{ background: "#f1f2f6" }} /> {currency}0 — not due this month / ended</span>
      </div>

      <PlannedTable
        cats={cats}
        monthsIso={monthsIso}
        currentIndex={PAST_MONTHS}
        actuals={actuals}
        income={income}
        currency={currency}
        patternAvg={patternAvg}
        patternReady={patternReady}
      />
    </div>
  );
}