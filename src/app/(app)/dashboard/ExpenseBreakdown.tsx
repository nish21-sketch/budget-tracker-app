"use client";

import { useState } from "react";
import { fmtCompact } from "@/lib/utils";
import type { Category } from "@/lib/data";

const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;

type CatWithSoFar = Category & { soFar: number };

function DualBar({
  label,
  plan,
  spent,
  scaleMax,
  currency,
}: {
  label: string;
  plan: number;
  spent: number;
  scaleMax: number;
  currency: string;
}) {
  const over = plan > 0 && spent > plan;
  const planPct = (plan / scaleMax) * 100;
  const spentPct = (spent / scaleMax) * 100;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{label}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <div style={{ flex: 1, height: 10, background: "#eef0f5", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${planPct}%`, background: "#3b82f6", borderRadius: 5 }} />
        </div>
        <span style={{ fontSize: 11, width: 56, textAlign: "right", color: "#374151" }}>{fmtCompact(plan, currency)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 10, background: "#eef0f5", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${spentPct}%`, background: over ? "#dc2626" : "#16a34a", borderRadius: 5 }} />
        </div>
        <span style={{ fontSize: 11, width: 56, textAlign: "right", color: over ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
          {fmtCompact(spent, currency)}
        </span>
      </div>
    </div>
  );
}

export default function ExpenseBreakdown({ cats, currency }: { cats: CatWithSoFar[]; currency: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(type: string) {
    setOpen((o) => ({ ...o, [type]: !o[type] }));
  }

  const activeCats = cats.filter((c) => Number(c.ideal_plan_amount) > 0 || c.soFar > 0);
  const scaleMax = Math.max(1, ...activeCats.map((c) => Math.max(Number(c.ideal_plan_amount), c.soFar)));
  const typeScaleMax = Math.max(
    1,
    ...TYPES.map((t) => {
      const list = activeCats.filter((c) => c.type === t);
      return Math.max(list.reduce((s, c) => s + Number(c.ideal_plan_amount), 0), list.reduce((s, c) => s + c.soFar, 0));
    })
  );

  return (
    <div className="card">
      <h3>Expense Breakdown <span className="sub">Top bar = budget, bottom bar = spend (red if over, green if under)</span></h3>
      <div>
        {TYPES.map((type) => {
          const typeCats = activeCats.filter((c) => c.type === type);
          if (typeCats.length === 0) return null;
          const isOpen = !!open[type];
          const typeSpent = typeCats.reduce((s, c) => s + c.soFar, 0);
          const typePlan = typeCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);

          return (
            <div key={type} style={{ marginBottom: 14, borderBottom: "1px solid #f1f2f6", paddingBottom: 8 }}>
              <div onClick={() => toggle(type)} style={{ cursor: "pointer", display: "flex", alignItems: "center", marginBottom: 4 }}>
                <span style={{ display: "inline-block", width: 14, transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{type}</span>
              </div>
              <DualBar label="" plan={typePlan} spent={typeSpent} scaleMax={typeScaleMax} currency={currency} />

              {isOpen && typeCats.map((c) => (
                <div key={c.id} style={{ paddingLeft: 20, marginTop: 6 }}>
                  <DualBar label={c.name} plan={Number(c.ideal_plan_amount)} spent={c.soFar} scaleMax={scaleMax} currency={currency} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}