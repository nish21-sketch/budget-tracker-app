"use client";

import { useState } from "react";
import { fmtCompact } from "@/lib/utils";
import type { Category } from "@/lib/data";

const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;

type CatWithSoFar = Category & { soFar: number };

function overPct(plan: number, spent: number): number | null {
  if (plan > 0 && spent > plan) return Math.round(((spent - plan) / plan) * 100);
  return null;
}

function Amount({ plan, spent, currency }: { plan: number; spent: number; currency: string }) {
  const over = spent > plan;
  const pct = overPct(plan, spent);
  return (
    <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ color: over ? "#dc2626" : undefined }}>{fmtCompact(spent, currency)}</span>
      {" / "}
      {fmtCompact(plan, currency)}
      {pct !== null && <span style={{ color: "#dc2626", marginLeft: 6 }}>▲ {pct}%</span>}
    </span>
  );
}

function Bars({ plan, spent }: { plan: number; spent: number }) {
  const over = spent > plan;
  const scale = Math.max(plan, spent, 1);
  return (
    <>
      <div className="goal-block">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(plan / scale) * 100}%`, background: "linear-gradient(90deg,#93c5fd,#3b82f6)" }}
          />
        </div>
      </div>
      <div className="goal-block">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(spent / scale) * 100}%`,
              background: over ? "linear-gradient(90deg,#fca5a5,#dc2626)" : "linear-gradient(90deg,#6ee7b7,#16a34a)",
            }}
          />
        </div>
      </div>
    </>
  );
}

export default function ExpenseBreakdown({ cats, currency }: { cats: CatWithSoFar[]; currency: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(type: string) {
    setOpen((o) => ({ ...o, [type]: !o[type] }));
  }

  const activeCats = cats.filter((c) => c.soFar > 0);
  const grandSpent = activeCats.reduce((s, c) => s + c.soFar, 0);
  const grandPlan = activeCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);

  return (
    <div className="card">
      <h3>Expense Breakdown <span className="sub">Tap a group to see its categories</span></h3>

      {activeCats.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Nothing spent yet this month — log an expense to see it here.</div>
      )}

      {TYPES.map((type) => {
        const typeCats = activeCats.filter((c) => c.type === type);
        if (typeCats.length === 0) return null;
        const isOpen = !!open[type];
        const typeSpent = typeCats.reduce((s, c) => s + c.soFar, 0);
        const typePlan = typeCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);

        return (
          <div key={type} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #f1f2f6" }}>
            <div
              onClick={() => toggle(type)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                <span style={{ display: "inline-block", width: 14, transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                {type}
              </span>
              <Amount plan={typePlan} spent={typeSpent} currency={currency} />
            </div>

            {isOpen &&
              typeCats.map((c) => {
                const plan = Number(c.ideal_plan_amount);
                return (
                  <div key={c.id} style={{ marginTop: 12, paddingLeft: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                      <Amount plan={plan} spent={c.soFar} currency={currency} />
                    </div>
                    <Bars plan={plan} spent={c.soFar} />
                  </div>
                );
              })}
          </div>
        );
      })}

      {activeCats.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 10,
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 14 }}>Total</span>
          <Amount plan={grandPlan} spent={grandSpent} currency={currency} />
        </div>
      )}
    </div>
  );
}