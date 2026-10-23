import { getCategories, getIncome, getSoFarByCategory, getProfile } from "@/lib/data";
import { fmt, firstOfMonth, addMonths, daysInMonth, monthLabel } from "@/lib/utils";
import ExpenseBreakdown from "./ExpenseBreakdown";

export default async function DashboardPage() {
  const now = firstOfMonth();
  const prevMonth = addMonths(now, -1);

  const [categories, income, soFarMap, profile, prevSoFarMap] = await Promise.all([
    getCategories(),
    getIncome(),
    getSoFarByCategory(),
    getProfile(),
    getSoFarByCategory(prevMonth),
  ]);
  const currency = profile?.currency ?? "₹";
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));

  const totalExpense = cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + c.soFar, 0);
  const totalInvestment = cats.filter((c) => c.type === "Investment").reduce((s, c) => s + c.soFar, 0);
  const cashInHand = income - totalExpense - totalInvestment;
  const spendBudget = cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + Number(c.ideal_plan_amount), 0);

  const budgetSpentWithinPlan = Math.min(totalExpense, spendBudget);
  const budgetOverAmount = Math.max(0, totalExpense - spendBudget);
  const budgetRemaining = Math.max(0, spendBudget - totalExpense);
  const budgetScaleMax = Math.max(spendBudget, totalExpense, 1);
  const budgetBluePct = (budgetSpentWithinPlan / budgetScaleMax) * 100;
  const budgetRedPct = (budgetOverAmount / budgetScaleMax) * 100;
  const budgetGreyPct = (budgetRemaining / budgetScaleMax) * 100;
  const isOverBudget = budgetOverAmount > 0;

  const emiCats = cats.filter((c) => c.end_date);

  const today = new Date();
  const timePct = Math.round((today.getDate() / daysInMonth(now)) * 100);
  const totalPlanAll = cats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
  const totalSpentAll = cats.reduce((s, c) => s + c.soFar, 0);
  const spendPct = totalPlanAll > 0 ? Math.round((totalSpentAll / totalPlanAll) * 100) : 0;
  const paceDelta = spendPct - timePct;

  const overspendCat = cats.find((c) => c.soFar > Number(c.ideal_plan_amount) && Number(c.ideal_plan_amount) > 0);

  const prevTotalSpent = cats.reduce((s, c) => s + (prevSoFarMap[c.id] ?? 0), 0);
  const trendPct = prevTotalSpent > 0 ? Math.round(((totalSpentAll - prevTotalSpent) / prevTotalSpent) * 100) : null;

  const dailyRate = today.getDate() > 0 ? totalSpentAll / today.getDate() : 0;
  const projectedTotal = Math.round(dailyRate * daysInMonth(now));
  const projDeltaPct = totalPlanAll > 0 ? Math.round(((projectedTotal - totalPlanAll) / totalPlanAll) * 100) : null;

  return (
    <div>
      <div className="kpi-row">
        <div className="card kpi-card"><div className="label">Monthly Income</div><div className="value">{fmt(income, currency)}</div></div>

        <div className="card kpi-card">
          <div className="label">Budget vs Spend</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 2 }}>
            Budget: {fmt(spendBudget, currency)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: isOverBudget ? "#dc2626" : "#16a34a" }}>
            Spend: {fmt(totalExpense, currency)}
          </div>
          <div className="bar-track bar-stacked" style={{ height: 8, marginTop: 8 }}>
            <div className="bar-seg" style={{ width: `${budgetBluePct}%`, background: "#3b82f6" }} />
            {isOverBudget && <div className="bar-seg" style={{ width: `${budgetRedPct}%`, background: "#dc2626" }} />}
            {!isOverBudget && budgetRemaining > 0 && <div className="bar-seg" style={{ width: `${budgetGreyPct}%`, background: "#e5e7eb" }} />}
          </div>
        </div>

        <div className="card kpi-card"><div className="label">Investment (so far)</div><div className="value">{fmt(totalInvestment, currency)}</div></div>
        <div className="card kpi-card"><div className="label">Cash in Hand</div><div className="value" style={{ color: cashInHand < 0 ? "#dc2626" : "#16a34a" }}>{fmt(cashInHand, currency)}</div></div>
      </div>

      {cats.length === 0 && (
        <div className="card" style={{ marginBottom: 16, color: "var(--muted)" }}>
          No categories yet — head to Settings to add some, or revisit onboarding.
        </div>
      )}

      {emiCats.length > 0 && (
        <div className="emi-row">
          {emiCats.map((c) => {
            const end = new Date(c.end_date!);
            const ended = end <= now;
            const monthsLeft = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
            return (
              <div className="card emi-card" key={c.id}>
                <div className="info">
                  <div className="name">{c.name}</div>
                  <div className="sub">{fmt(Number(c.ideal_plan_amount), currency)} / month · {ended ? "ended" : "ends"} {monthLabel(end)}</div>
                </div>
                <div className={`emi-badge ${ended ? "ended" : "active"}`}>{ended ? "Ended ✓" : `${monthsLeft} months left`}</div>
              </div>
            );
          })}
          {emiCats.filter((c) => new Date(c.end_date!) <= now).map((c) => (
            <div className="emi-ended-note" key={c.id + "-note"}>
              💡 {c.name} ended — {fmt(Number(c.ideal_plan_amount), currency)}/month is now free. Consider redirecting it to your Emergency Fund or SIP.
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Budget Pace <span className="sub">Are you spending faster than the month is passing?</span></h3>
          <div className="goal-block">
            <div className="goal-label">Month elapsed</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${timePct}%`, background: "linear-gradient(90deg,#a5b4fc,#6366f1)" }} /></div>
          </div>
          <div className="goal-block">
            <div className="goal-label">Budget spent</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(spendPct, 100)}%`, background: paceDelta > 15 ? "linear-gradient(90deg,#fca5a5,#dc2626)" : "linear-gradient(90deg,#6ee7b7,#16a34a)" }} /></div>
          </div>
          <div className={`insight-line ${paceDelta > 15 ? "warn" : ""}`} style={{ marginTop: 4 }}>
            {paceDelta > 15
              ? `⚠️ You've used ${spendPct}% of your budget but only ${timePct}% of the month has passed — spending is outpacing time.`
              : `✅ Spending (${spendPct}%) is tracking with how much of the month has passed (${timePct}%).`}
          </div>
        </div>

        <div className="card">
          <h3>Smart Insights</h3>
          <div className="insights">
            {overspendCat && (
              <div className="insight-line warn">⚠️ You&apos;ve gone over plan on <b>{overspendCat.name}</b> — {fmt(overspendCat.soFar, currency)} logged vs {fmt(Number(overspendCat.ideal_plan_amount), currency)} planned.</div>
            )}
            {trendPct !== null && (
              <div className={`insight-line ${trendPct > 15 ? "warn" : ""}`}>
                {trendPct >= 0 ? "📈" : "📉"} You&apos;ve spent {fmt(totalSpentAll, currency)} so far this month — {Math.abs(trendPct)}% {trendPct >= 0 ? "more" : "less"} than you spent all of last month ({fmt(prevTotalSpent, currency)}).
              </div>
            )}
            {totalPlanAll > 0 && projDeltaPct !== null && (
              <div className={`insight-line ${projDeltaPct > 0 ? "warn" : ""}`}>
                🔮 At this pace, you&apos;re projected to spend {fmt(projectedTotal, currency)} by month-end — {projDeltaPct >= 0 ? `${projDeltaPct}% over` : `${Math.abs(projDeltaPct)}% under`} your {fmt(totalPlanAll, currency)} plan.
              </div>
            )}
          </div>
        </div>
      </div>

      <ExpenseBreakdown cats={cats} currency={currency} />
    </div>
  );
}