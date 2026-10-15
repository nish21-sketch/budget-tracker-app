import { getCategories, getSoFarByCategory, getIncome, getProfile } from "@/lib/data";
import { firstOfMonth, addMonths } from "@/lib/utils";
import { fmt } from "@/lib/utils";
import Link from "next/link";
import PlannedTable from "./PlannedTable";

const FORECAST_MONTHS = 12;

export default async function PlannedPage() {
  const [categories, soFarMap, income, profile] = await Promise.all([
    getCategories(),
    getSoFarByCategory(),
    getIncome(),
    getProfile(),
  ]);
  const currency = profile?.currency ?? "₹";
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));
  const now = firstOfMonth();
  const months = Array.from({ length: FORECAST_MONTHS }, (_, i) => addMonths(now, i));
  const monthsIso = months.map((m) => m.toISOString());

  const spendTotal = cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + c.soFar, 0);
  const saveTotal = cats.filter((c) => c.type === "Investment").reduce((s, c) => s + c.soFar, 0);

  return (
    <div>
      <h2 style={{ margin: "4px 0 2px", fontSize: 18 }}>Future Estimate</h2>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
        The current month shows your actual spend logged so far (highlighted). Every other column is your Ideal Plan
        Amount, projected forward — and automatically drops to {currency}0 once a loan/EMI&apos;s end date has passed.
        Tap a category group to expand it.
      </p>

      <div className="legend-row">
        <span><span className="legend-dot" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }} /> Current month (actual so far)</span>
        <span><span className="legend-dot" style={{ background: "var(--red-soft)", border: "1px solid var(--red)" }} /> Over plan</span>
        <span><span className="legend-dot" style={{ background: "#f1f2f6" }} /> {currency}0 — EMI/loan ended</span>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card kpi-card" style={{ borderLeft: "4px solid #d97706" }}>
          <div className="label">Total Spend (this month)</div>
          <div className="value">{fmt(spendTotal, currency)}</div>
        </div>
        <div className="card kpi-card" style={{ borderLeft: "4px solid #16a34a" }}>
          <div className="label">Total Save/Invest (this month)</div>
          <div className="value">{fmt(saveTotal, currency)}</div>
        </div>
        <Link href="/historic" className="card kpi-card" style={{ textDecoration: "none", color: "inherit", display: "block", cursor: "pointer" }}>
          <div className="label">View your full history</div>
          <div className="value" style={{ fontSize: 16, color: "var(--accent)" }}>Historic →</div>
        </Link>
      </div>

      <PlannedTable cats={cats} monthsIso={monthsIso} income={income} currency={currency} />
    </div>
  );
}