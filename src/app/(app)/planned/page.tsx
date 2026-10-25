import Link from "next/link";
import { getCategories, getSoFarByCategory, getIncome, getProfile, getMonthlySpendTotals, getActiveCycle } from "@/lib/data";
import { addMonths, fmt, toDateInputValue } from "@/lib/utils";
import PlannedTable from "./PlannedTable";

const FORECAST_MONTHS = 12;

export default async function PlannedPage() {
  const now = await getActiveCycle();
  const [categories, soFarMap, income, profile, monthTotals] = await Promise.all([
    getCategories(),
    getSoFarByCategory(now),
    getIncome(),
    getProfile(),
    getMonthlySpendTotals(),
  ]);
  const currency = profile?.currency ?? "₹";
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));
  const months = Array.from({ length: FORECAST_MONTHS }, (_, i) => addMonths(now, i));
  const monthsIso = months.map((m) => m.toISOString());

  const currentKey = toDateInputValue(now);
  const completed = Object.entries(monthTotals)
    .filter(([k]) => k < currentKey)
    .map(([, v]) => v);
  const avgMonthlySpend =
    completed.length > 0
      ? completed.reduce((a, b) => a + b, 0) / completed.length
      : (monthTotals[currentKey] ?? 0);
  const avgSub =
    completed.length > 0
      ? `avg of ${completed.length} month${completed.length === 1 ? "" : "s"}`
      : "this cycle so far";

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

      <div className="legend-row">
        <span><span className="legend-dot" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }} /> Current cycle (actual so far)</span>
        <span><span className="legend-dot" style={{ background: "var(--red-soft)", border: "1px solid var(--red)" }} /> Over plan</span>
        <span><span className="legend-dot" style={{ background: "#f1f2f6" }} /> {currency}0 — EMI/loan ended</span>
      </div>

      <PlannedTable cats={cats} monthsIso={monthsIso} income={income} currency={currency} />
    </div>
  );
}