import { getCategories, getIncome, getSoFarByCategory, getProfile } from "@/lib/data";
import { fmt, firstOfMonth, daysInMonth, monthLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const [categories, income, soFarMap, profile] = await Promise.all([
    getCategories(),
    getIncome(),
    getSoFarByCategory(),
    getProfile(),
  ]);
  const currency = profile?.currency ?? "₹";
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));

  const totalExpense = cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + c.soFar, 0);
  const totalInvestment = cats.filter((c) => c.type === "Investment").reduce((s, c) => s + c.soFar, 0);
  const cashInHand = income - totalExpense - totalInvestment;
  const savingsRate = income > 0 ? Math.round((cashInHand / income) * 100) : 0;

  const emiCats = cats.filter((c) => c.end_date);
  const now = firstOfMonth();

  // Budget pace
  const today = new Date();
  const timePct = Math.round((today.getDate() / daysInMonth(now)) * 100);
  const totalPlanAll = cats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
  const totalSpentAll = cats.reduce((s, c) => s + c.soFar, 0);
  const spendPct = totalPlanAll > 0 ? Math.round((totalSpentAll / totalPlanAll) * 100) : 0;
  const paceDelta = spendPct - timePct;

  const sortedHeat = [...cats].sort((a, b) => Number(b.ideal_plan_amount) - Number(a.ideal_plan_amount)).slice(0, 8);
  const maxPlan = Math.max(1, ...cats.map((c) => Number(c.ideal_plan_amount)));
  const topCat = [...cats].sort((a, b) => b.soFar - a.soFar)[0];
  const overspendCat = cats.find((c) => c.soFar > Number(c.ideal_plan_amount) && Number(c.ideal_plan_amount) > 0);

  return (
    <div>
      <div className="kpi-row">
        <div className="card kpi-card"><div className="label">Monthly Income</div><div className="value">{fmt(income, currency)}</div></div>
        <div className="card kpi-card"><div className="label">Expense (so far)</div><div className="value">{fmt(totalExpense, currency)}</div></div>
        <div className="card kpi-card"><div className="label">Investment (so far)</div><div className="value">{fmt(totalInvestment, currency)}</div></div>
        <div className="card kpi-card"><div className="label">Cash in Hand</div><div className="value" style={{ color: cashInHand < 0 ? "#dc2626" : "#16a34a" }}>{fmt(cashInHand, currency)}</div></div>
        <div className="card kpi-card"><div className="label">Savings Rate</div><div className="value">{savingsRate}%</div></div>
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
          <h3>Insights</h3>
          <div className="insights">
            {topCat && <div className="insight-line">💡 Top expense category this month: <b>{topCat.name} ({fmt(topCat.soFar, currency)})</b></div>}
            {overspendCat && (
              <div className="insight-line warn">⚠️ You&apos;ve gone over plan on <b>{overspendCat.name}</b> — {fmt(overspendCat.soFar, currency)} logged vs {fmt(Number(overspendCat.ideal_plan_amount), currency)} planned.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Expense Breakdown <span className="sub">Ranked by ideal plan amount</span></h3>
        <div className="heat-list">
          {sortedHeat.map((c) => {
            const pct = Math.round((Number(c.ideal_plan_amount) / maxPlan) * 100);
            return (
              <div className="heat-row" key={c.id}>
                <div className="cat-name">{c.name}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                <div className="amt">{fmt(Number(c.ideal_plan_amount), currency)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
