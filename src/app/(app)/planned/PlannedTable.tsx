"use client";

import { useEffect, useRef, useState } from "react";
import { fmt, monthLabel } from "@/lib/utils";
import { isDueInMonth, frequencyTag } from "@/lib/frequency";
import type { Category } from "@/lib/data";

const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;

type CatWithSoFar = Category & { soFar: number };

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function PlannedTable({
  cats,
  monthsIso,
  currentIndex,
  actuals,
  income,
  currency,
}: {
  cats: CatWithSoFar[];
  monthsIso: string[];
  currentIndex: number;
  actuals: Record<string, Record<string, number>>;
  income: number;
  currency: string;
}) {
  const months = monthsIso.map((s) => {
    const d = new Date(s);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
  });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open scrolled to the current month, with the past months just off to the left
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cur = el.querySelector("th.current-col") as HTMLElement | null;
    const first = el.querySelector("th") as HTMLElement | null;
    if (cur && first) el.scrollLeft = Math.max(0, cur.offsetLeft - first.offsetWidth);
  }, []);

  function toggle(type: string) {
    setOpen((o) => ({ ...o, [type]: !o[type] }));
  }

  function planForMonth(cat: CatWithSoFar, monthDate: Date) {
    if (!isDueInMonth(cat.frequency, cat.due_month, monthDate)) return 0;
    if (cat.end_date) {
      const end = new Date(cat.end_date);
      if (monthDate >= new Date(end.getFullYear(), end.getMonth(), 1)) return 0;
    }
    return Number(cat.ideal_plan_amount);
  }

  // Past months: what you actually spent. Current: spent so far. Future: the plan.
  function valueFor(cat: CatWithSoFar, m: Date, i: number) {
    if (i < currentIndex) return actuals[keyOf(m)]?.[cat.id] ?? 0;
    if (i === currentIndex) return cat.soFar;
    return planForMonth(cat, m);
  }

  function subtotal(type: string, m: Date, i: number) {
    return cats.filter((c) => c.type === type).reduce((s, c) => s + valueFor(c, m, i), 0);
  }

  function plannedBudget(m: Date) {
    return cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + planForMonth(c, m), 0);
  }

  function totalExpense(m: Date, i: number) {
    return cats.filter((c) => c.type !== "Investment").reduce((s, c) => s + valueFor(c, m, i), 0);
  }

  function totalInvest(m: Date, i: number) {
    return cats.filter((c) => c.type === "Investment").reduce((s, c) => s + valueFor(c, m, i), 0);
  }

  const cls = (i: number) => (i === currentIndex ? "current-col" : "");
  const pastStyle = (i: number): React.CSSProperties | undefined =>
    i < currentIndex ? { color: "#6b7280" } : undefined;

  return (
    <div className="budget-scroll" ref={scrollRef}>
      <table className="budget-table compact">
        <thead>
          <tr>
            <th>Category</th>
            {months.map((m, i) => (
              <th key={i} className={cls(i)} style={i < currentIndex ? { color: "#9ca3af" } : undefined}>
                {monthLabel(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TYPES.map((type) => {
            const isOpen = !!open[type];
            const typeCats = cats.filter((c) => c.type === type);
            return (
              <>
                <tr
                  key={type}
                  className={`type-row ${type === "Investment" ? "save-row" : "spend-row"} type-row-toggle`}
                  onClick={() => toggle(type)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span style={{ display: "inline-block", width: 12, transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                    {type}
                  </td>
                  {months.map((m, i) => (
                    <td key={i} className={cls(i)} style={pastStyle(i)}>{fmt(subtotal(type, m, i), currency)}</td>
                  ))}
                </tr>
                {isOpen && typeCats.map((cat) => {
                  const tag = frequencyTag(cat.frequency);
                  return (
                    <tr key={cat.id}>
                      <td>
                        <div className="cat-cell" style={{ paddingLeft: 12 }}>
                          {cat.name}
                          <span className="cat-meta">
                            Plan: {fmt(Number(cat.ideal_plan_amount), currency)}
                            {tag ? ` · ${tag}` : ""}
                            {cat.end_date ? ` · ends ${monthLabel(new Date(cat.end_date))}` : ""}
                          </span>
                        </div>
                      </td>
                      {months.map((m, i) => {
                        const val = valueFor(cat, m, i);
                        if (i === currentIndex) {
                          const plan = planForMonth(cat, m);
                          const over = cat.soFar > plan && plan > 0;
                          return <td key={i} className={`current-col ${over ? "over" : ""}`}>{fmt(val, currency)}</td>;
                        }
                        if (i < currentIndex) {
                          return <td key={i} style={pastStyle(i)}>{fmt(val, currency)}</td>;
                        }
                        const dimmed = val === 0 && (!!cat.end_date || (cat.frequency ?? "monthly") !== "monthly");
                        return <td key={i} className={dimmed ? "zeroed" : ""}>{fmt(val, currency)}</td>;
                      })}
                    </tr>
                  );
                })}
              </>
            );
          })}

          <tr className="total-row">
            <td>Income</td>
            {months.map((m, i) => (
              <td key={i} className={cls(i)} style={pastStyle(i)}>{fmt(income, currency)}</td>
            ))}
          </tr>
          <tr className="total-row">
            <td>Planned Budget</td>
            {months.map((m, i) => (
              <td key={i} className={cls(i)} style={pastStyle(i)}>{fmt(plannedBudget(m), currency)}</td>
            ))}
          </tr>
          <tr className="total-row">
            <td>Total Expense</td>
            {months.map((m, i) => (
              <td key={i} className={cls(i)} style={pastStyle(i)}>{fmt(totalExpense(m, i), currency)}</td>
            ))}
          </tr>
          <tr className="total-row">
            <td>Cash in Hand</td>
            {months.map((m, i) => {
              const cash = income - totalExpense(m, i) - totalInvest(m, i);
              return (
                <td key={i} className={cls(i)} style={{ color: cash < 0 ? "#dc2626" : "#16a34a" }}>
                  {fmt(cash, currency)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}