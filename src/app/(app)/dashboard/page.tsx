import Link from "next/link";
import {
  getCategories,
  getIncome,
  getSoFarByCategory,
  getProfile,
  getActiveCycleStart,
  getCategoryHistory,
} from "@/lib/data";
import { fmt, addMonths, daysInMonth, monthLabel } from "@/lib/utils";
import { isDueInMonth, nextDueAfter } from "@/lib/frequency";
import ExpenseBreakdown from "./ExpenseBreakdown";
import BillsCard from "./BillsCard";
import type { BillRow, UpcomingRow } from "./BillsCard";

type TrendLine = { id: string; name: string; spent: number; avg: number; pct: number };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const sp = await searchParams;
  const { cycle: active, start: activeStart } = await getActiveCycleStart();

  let viewing = active;
  if (typeof sp.cycle === "string" && /^\d{4}-\d{2}-01$/.test(sp.cycle)) {
    const [vy, vm] = sp.cycle.split("-").map(Number);
    const candidate = new Date(vy, vm - 1, 1);
    if (candidate < active) viewing = candidate;
  }
  const isPast = viewing < active;
  const now = viewing;
  const cycleStart = isPast ? viewing : activeStart;
  const prevMonth = addMonths(now, -1);

  const [categories, income, soFarMap, profile, prevSoFarMap, history] = await Promise.all([
    getCategories(),
    getIncome(),
    getSoFarByCategory(now),
    getProfile(),
    getSoFarByCategory(prevMonth),
    getCategoryHistory(addMonths(now, -3), now),
  ]);
  const currency = profile?.currency ?? "₹";
  const cats = categories.map((c) => ({
    ...c,
    ideal_plan_amount: isDueInMonth(c.frequency, c.due_month, now) ? Number(c.ideal_plan_amount) : 0,
    soFar: soFarMap[c.id] ?? 0,
  }));

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

  // Days into the cycle, counted from the day it actually began (the day you tapped Start, if early)
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dim = daysInMonth(now);
  const elapsed = Math.min(dim, Math.max(0, Math.floor((todayMid.getTime() - cycleStart.getTime()) / 86400000) + 1));
  const timePct = Math.round((elapsed / dim) * 100);

  const totalPlanAll = cats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
  const totalSpentAll = cats.reduce((s, c) => s + c.soFar, 0);
  const spendPct = totalPlanAll > 0 ? Math.round((totalSpentAll / totalPlanAll) * 100) : 0;
  const paceDelta = spendPct - timePct;

  const overspendCat = cats.find((c) => c.soFar > Number(c.ideal_plan_amount) && Number(c.ideal_plan_amount) > 0);

  const prevTotalSpent = cats.reduce((s, c) => s + (prevSoFarMap[c.id] ?? 0), 0);
  const trendPct = prevTotalSpent > 0 ? Math.round(((totalSpentAll - prevTotalSpent) / prevTotalSpent) * 100) : null;

  // Safe to spend: flexible budgets (Fluid Essential + Personal) left, spread over the days left
  const flexTypes: string[] = ["Fluid Essential", "Personal"];
  const flexCats = cats.filter((c) => flexTypes.includes(c.type));
  const flexPlan = flexCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
  const flexSpent = flexCats.reduce((s, c) => s + c.soFar, 0);
  const flexLeft = flexPlan - flexSpent;
  const daysLeft = elapsed === 0 ? dim : Math.max(1, dim - elapsed + 1);
  const perDay = flexLeft > 0 ? Math.floor(flexLeft / daysLeft) : 0;
  const showSafe = !isPast && flexPlan > 0;

  // Pace forecast: fixed bills count in full, only flexible spending is projected forward.
  // Compared with the same Spend Budget shown in the top tile.
  const fixedCats = cats.filter((c) => c.type === "Fixed Deduction");
  const fixedSpent = fixedCats.reduce((s, c) => s + c.soFar, 0);
  const fixedPlan = fixedCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
  const forecastReady = !isPast && elapsed >= 5 && spendBudget > 0;
  const projectedSpend =
    Math.max(fixedSpent, fixedPlan) + (elapsed > 0 ? Math.round((flexSpent / elapsed) * dim) : 0);
  const projDeltaPct = spendBudget > 0 ? Math.round(((projectedSpend - spendBudget) / spendBudget) * 100) : 0;
  const forecastWaiting = !isPast && elapsed < 5 && spendBudget > 0;

  // Bills: Fixed Deduction + Investment categories, plus anything that repeats less often than monthly
  function hasEnded(endDate: string | null) {
    if (!endDate) return false;
    const e = new Date(endDate);
    return now >= new Date(e.getFullYear(), e.getMonth(), 1);
  }
  const billCats = categories.filter(
    (c) =>
      c.type === "Fixed Deduction" ||
      c.type === "Investment" ||
      (c.frequency ?? "monthly") !== "monthly"
  );
  const billsToPay: BillRow[] = billCats
    .filter(
      (c) =>
        !hasEnded(c.end_date) &&
        isDueInMonth(c.frequency, c.due_month, now) &&
        Number(c.ideal_plan_amount) > 0
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      plan: Number(c.ideal_plan_amount),
      paid: soFarMap[c.id] ?? 0,
    }));
  const upcomingBills: UpcomingRow[] = billCats
    .filter(
      (c) =>
        (c.frequency ?? "monthly") !== "monthly" &&
        !hasEnded(c.end_date) &&
        !isDueInMonth(c.frequency, c.due_month, now) &&
        Number(c.ideal_plan_amount) > 0
    )
    .map((c) => {
      const n = nextDueAfter(c.frequency, c.due_month, now);
      return n
        ? {
            id: c.id,
            name: c.name,
            amount: Number(c.ideal_plan_amount),
            dueLabel: monthLabel(n.date),
            monthsAway: n.monthsAway,
          }
        : null;
    })
    .filter((x): x is UpcomingRow => x !== null)
    .sort((a, b) => a.monthsAway - b.monthsAway);
  const showBills = !isPast && billsToPay.length + upcomingBills.length > 0;

  // Category trend vs the average of the previous 3 cycles
  const trendLines: TrendLine[] =
    history.monthCount > 0
      ? cats
          .filter((c) => c.soFar > 0)
          .map((c): TrendLine | null => {
            const avg = (history.totals[c.id] ?? 0) / history.monthCount;
            if (avg <= 0) return null;
            const pct = Math.round(((c.soFar - avg) / avg) * 100);
            return { id: c.id, name: c.name, spent: c.soFar, avg, pct };
          })
          .filter((x): x is TrendLine => x !== null && (isPast ? Math.abs(x.pct) >= 25 : x.pct >= 25))
          .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
          .slice(0, 3)
      : [];

  return (
    <div>
      {isPast && (
        <div
          className="card"
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>Viewing past cycle: {monthLabel(viewing)}</span>
          <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
            Back to current →
          </Link>
        </div>
      )}

      <div className="kpi-row">
        <div className="card kpi-card">
          <div className="label">Monthly Income</div>
          <div className="value">{fmt(income, currency)}</div>
        </div>

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

      {showSafe && (
        <div
          className="card"
          style={{ marginBottom: 16, borderLeft: `4px solid ${flexLeft > 0 ? "#16a34a" : "#dc2626"}` }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>Safe to spend today</div>
          {flexLeft > 0 ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>
                {fmt(perDay, currency)}{" "}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>a day</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {`${fmt(flexLeft, currency)} left for the next ${daysLeft} day${daysLeft === 1 ? "" : "s"} · Fluid Essential + Personal`}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>Flexible budget used up</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {flexLeft < 0
                  ? `${fmt(Math.abs(flexLeft), currency)} over · Fluid Essential + Personal`
                  : "Nothing left in Fluid Essential + Personal"}
              </div>
            </>
          )}
        </div>
      )}

      {showBills && (
        <BillsCard key={now.toISOString()} bills={billsToPay} upcoming={upcomingBills} currency={currency} />
      )}

      {cats.length === 0 && (
        <div className="card" style={{ marginBottom: 16, color: "var(--muted)" }}>
          No categories yet — head to Settings to add some, or revisit onboarding.
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Budget Pace <span className="sub">Are you spending faster than the cycle is passing?</span></h3>
          <div className="goal-block">
            <div className="goal-label">{`Cycle elapsed${elapsed > 0 ? ` · day ${elapsed} of ${dim}` : ""}`}</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${timePct}%`, background: "linear-gradient(90deg,#a5b4fc,#6366f1)" }} /></div>
          </div>
          <div className="goal-block">
            <div className="goal-label">Budget spent</div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(spendPct, 100)}%`, background: paceDelta > 15 ? "linear-gradient(90deg,#fca5a5,#dc2626)" : "linear-gradient(90deg,#6ee7b7,#16a34a)" }} /></div>
          </div>
          <div className={`insight-line ${paceDelta > 15 ? "warn" : ""}`} style={{ marginTop: 4 }}>
            {paceDelta > 15
              ? `⚠️ You've used ${spendPct}% of your budget but only ${timePct}% of the cycle has passed — spending is outpacing time.`
              : `✅ Spending (${spendPct}%) is tracking with how much of the cycle has passed (${timePct}%).`}
          </div>
        </div>

        <div className="card">
          <h3>Smart Insights</h3>
          <div className="insights">
            {overspendCat && (
              <div className="insight-line warn">
                {`⚠️ You've gone over plan on ${overspendCat.name} — ${fmt(overspendCat.soFar, currency)} logged vs ${fmt(Number(overspendCat.ideal_plan_amount), currency)} planned.`}
              </div>
            )}
            {trendPct !== null && (
              <div className={`insight-line ${trendPct > 15 ? "warn" : ""}`}>
                {`${trendPct >= 0 ? "📈" : "📉"} ${isPast ? `You spent ${fmt(totalSpentAll, currency)} in ${monthLabel(viewing)}` : `You've spent ${fmt(totalSpentAll, currency)} so far this cycle`} — ${Math.abs(trendPct)}% ${trendPct >= 0 ? "more" : "less"} than you spent in ${monthLabel(prevMonth)} (${fmt(prevTotalSpent, currency)}).`}
              </div>
            )}
            {trendLines.map((t) => (
              <div key={t.id} className={`insight-line ${t.pct > 0 ? "warn" : ""}`}>
                {`${t.pct > 0 ? "▲" : "▼"} ${t.name}: ${fmt(t.spent, currency)}${isPast ? "" : " so far"} — ${Math.abs(t.pct)}% ${t.pct > 0 ? "above" : "below"} your ${history.monthCount}-month average (${fmt(Math.round(t.avg), currency)}).`}
              </div>
            ))}
            {forecastReady && (
              <div className={`insight-line ${projDeltaPct > 0 ? "warn" : ""}`}>
                {`🔮 At this pace you'll spend about ${fmt(projectedSpend, currency)} by the end of the cycle — ${projDeltaPct >= 0 ? `${projDeltaPct}% over` : `${Math.abs(projDeltaPct)}% under`} your ${fmt(spendBudget, currency)} budget (fixed bills counted in full).`}
              </div>
            )}
            {forecastWaiting && (
              <div className="insight-line">🔮 The month-end forecast appears after day 5 of the cycle.</div>
            )}
          </div>
        </div>
      </div>

      <ExpenseBreakdown cats={cats} currency={currency} />

      {emiCats.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>EMIs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
            {emiCats.map((c) => {
              const end = new Date(c.end_date!);
              const ended = end <= now;
              const monthsLeft = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
              return (
                <div key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 6px" }}>
                    {fmt(Number(c.ideal_plan_amount), currency)} / month · {ended ? "ended" : "ends"} {monthLabel(end)}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: ended ? "#ecfdf5" : "#eef2ff",
                      color: ended ? "#059669" : "#4f46e5",
                    }}
                  >
                    {ended ? "Ended ✓" : `${monthsLeft} months left`}
                  </span>
                </div>
              );
            })}
          </div>
          {!isPast &&
            emiCats.filter((c) => new Date(c.end_date!) <= now).map((c) => (
              <div key={c.id + "-note"} style={{ fontSize: 12, color: "#6b7280", marginTop: 10 }}>
                {`💡 ${c.name} ended — ${fmt(Number(c.ideal_plan_amount), currency)}/month is now free. Consider redirecting it to your Emergency Fund or SIP.`}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}