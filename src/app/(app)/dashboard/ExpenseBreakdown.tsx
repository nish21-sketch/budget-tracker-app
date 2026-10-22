"use client";

import { useState } from "react";
import { fmtCompact } from "@/lib/utils";
import type { Category } from "@/lib/data";

const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;

type CatWithSoFar = Category & { soFar: number };

export default function ExpenseBreakdown({ cats, currency }: { cats: CatWithSoFar[]; currency: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(type: string) {
    setOpen((o) => ({ ...o, [type]: !o[type] }));
  }

  const heatScaleMax = Math.max(1, ...cats.map((c) => Math.max(Number(c.ideal_plan_amount), c.soFar)));

  return (
    <div className="card">
      <h3>Expense Breakdown <span className="sub">Spent (blue) vs. remaining budget (gray) vs. over (red)</span></h3>
      <div className="heat-list">
        {TYPES.map((type) => {
          const typeCats = cats.filter((c) => c.type === type);
          if (typeCats.length === 0) return null;
          const isOpen = !!open[type];
          const typeSpent = typeCats.reduce((s, c) => s + c.soFar, 0);
          const typePlan = typeCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
          return (
            <div key={type}>
              <div
                onClick={() => toggle(type)}
                style={{ cursor: "pointer", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13 }}
              >
                <span>
                  <span style={{ display: "inline-block", width: 12, transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                  {" "}{type}
                </span>
                <span>{fmtCompact(typeSpent, currency)} / {fmtCompact(typePlan, currency)}</span>
              </div>
              {isOpen && typeCats.map((c) => {
                const plan = Number(c.ideal_plan_amount);
                const spentWithinPlan = Math.min(c.soFar, plan);
                const overAmount = Math.max(0, c.soFar - plan);
                const remaining = Math.max(0, plan - c.soFar);
                const spentPct = (spentWithinPlan / heatScaleMax) * 100;
                const overPct = (overAmount / heatScaleMax) * 100;
                const remainingPct = (remaining / heatScaleMax) * 100;
                const over = overAmount > 0;
                return (
                  <div className="heat-row" key={c.id} style={{ paddingLeft: 18 }}>
                    <div className="cat-name" style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="bar-track bar-stacked">
                      <div className="bar-seg" style={{ width: `${spentPct}%`, background: "linear-gradient(90deg,#93c5fd,#3b82f6)" }} />
                      {over && <div className="bar-seg" style={{ width: `${overPct}%`, background: "linear-gradient(90deg,#f87171,#dc2626)" }} />}
                      {!over && remaining > 0 && <div className="bar-seg" style={{ width: `${remainingPct}%`, background: "#e5e7eb" }} />}
                    </div>
                    <div className="amt" style={{ color: over ? "#dc2626" : undefined }}>
                      {fmtCompact(c.soFar, currency)} / {fmtCompact(plan, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}