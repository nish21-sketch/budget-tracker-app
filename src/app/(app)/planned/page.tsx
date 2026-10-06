import Link from "next/link";
import { getCategories, getSoFarByCategory, getIncome, getProfile } from "@/lib/data";
import { fmt, firstOfMonth, addMonths, monthLabel } from "@/lib/utils";

const FORECAST_MONTHS = 12;
const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;

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

  function planForMonth(cat: typeof cats[number], monthDate: Date) {
    if (cat.end_date) {
      const end = new Date(cat.end_date);
      if (monthDate >= new Date(end.getFullYear(), end.getMonth(), 1)) return 0;
    }
    return Number(cat.ideal_plan_amount);
  }

  function subtotal(type: string, m: Date, i: number) {
    const list = cats.filter((c) => c.type === type);
    if (i === 0) return list.reduce((s, c) => s + c.soFar, 0);
    return list.reduce((s, c) => s + planForMonth(c, m), 0);
  }

  const spendTotal = cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + c.soFar, 0);
  const saveTotal = cats.filter((c) => c.type === "Investment").reduce((s, c) => s + c.soFar, 0);

  return (
    <div>
      <h2 style={{ margin: "4px 0 2px", fontSize: 18 }}>Future Estimate</h2>
      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
        The current month shows your actual spend logged so far (highlighted). Every other column is your Ideal Plan
        Amount, projected forward — and automatically drops to {currency}0 once a loan/EMI&apos;s end date has passed.
      </p>

      <div className="legend-row">
        <span><span className="legend-dot" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }} /> Current month (actual so far)</span>
        <span><span className="legend-dot" style={{ background: "var(--red-soft)", border: "1px solid var(--red)" }} /> Over plan</span>
        <span><span className="legend-dot" style={{ background: "#f1f2f6" }} /> {currency}0 — EMI/loan ended</span>
        <span><span className="legend-dot" style={{ background: "#fde68a" }} /> Spend subtotal</span>
        <span><span className="legend-dot" style={{ background: "#bbf7d0" }} /> Save/Invest subtotal</span>
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

      <div className="budget-scroll">
        <table className="budget-table">
          <thead>
            <tr>
              <th>Category</th>
              {months.map((m, i) => (
                <th key={i} className={i === 0 ? "current-col" : ""}>{monthLabel(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPES.map((type) => (
              <>
                <tr key={type} className={`type-row ${type === "Investment" ? "save-row" : "spend-row"}`}>
                  <td>{type} <span style={{ fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>({type === "Investment" ? "Save" : "Spend"})</span></td>
                  {months.map((m, i) => (
                    <td key={i} className={i === 0 ? "current-col" : ""}>{fmt(subtotal(type, m, i), currency)}</td>
                  ))}
                </tr>
                {cats.filter((c) => c.type === type).map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="cat-cell">
                        {cat.name}
                        <span className="cat-meta">
                          Plan: {fmt(Number(cat.ideal_plan_amount), currency)}
                          {cat.end_date ? ` · ends ${monthLabel(new Date(cat.end_date))}` : ""}
                        </span>
                      </div>
                    </td>
                    {months.map((m, i) => {
                      if (i === 0) {
                        const over = cat.soFar > Number(cat.ideal_plan_amount) && Number(cat.ideal_plan_amount) > 0;
                        return <td key={i} className={`current-col ${over ? "over" : ""}`}>{fmt(cat.soFar, currency)}</td>;
                      }
                      const amt = planForMonth(cat, m);
                      return <td key={i} className={amt === 0 && cat.end_date ? "zeroed" : ""}>{fmt(amt, currency)}</td>;
                    })}
                  </tr>
                ))}
              </>
            ))}

            <tr className="total-row">
              <td>Income</td>
              {months.map((m, i) => (
                <td key={i} className={i === 0 ? "current-col" : ""}>{fmt(income, currency)}</td>
              ))}
            </tr>
            <tr className="total-row">
              <td>Total Expense</td>
              {months.map((m, i) => {
                const total = i === 0
                  ? cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + c.soFar, 0)
                  : cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + planForMonth(c, m), 0);
                return <td key={i} className={i === 0 ? "current-col" : ""}>{fmt(total, currency)}</td>;
              })}
            </tr>
            <tr className="total-row">
              <td>Total Investment</td>
              {months.map((m, i) => {
                const total = i === 0
                  ? cats.filter((c) => c.type === "Investment").reduce((s, c) => s + c.soFar, 0)
                  : cats.filter((c) => c.type === "Investment").reduce((s, c) => s + planForMonth(c, m), 0);
                return <td key={i} className={i === 0 ? "current-col" : ""}>{fmt(total, currency)}</td>;
              })}
            </tr>
            <tr className="total-row">
              <td>Cash in Hand</td>
              {months.map((m, i) => {
                const expense = i === 0
                  ? cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + c.soFar, 0)
                  : cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + planForMonth(c, m), 0);
                const invest = i === 0
                  ? cats.filter((c) => c.type === "Investment").reduce((s, c) => s + c.soFar, 0)
                  : cats.filter((c) => c.type === "Investment").reduce((s, c) => s + planForMonth(c, m), 0);
                const cash = income - expense - invest;
                return (
                  <td key={i} className={i === 0 ? "current-col" : ""} style={{ color: cash < 0 ? "#dc2626" : "#16a34a" }}>
                    {fmt(cash, currency)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
