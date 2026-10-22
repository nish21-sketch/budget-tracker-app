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

  const activeCats = cats.filter((c) => Number(c.ideal_plan_amount) > 0 || c.soFar > 0);

  const heatScaleMax = Math.max(1, ...activeCats.map((c) => Math.max(Number(c.ideal_plan_amount), c.soFar)));
  const typeScaleMax = Math.max(
    1,
    ...TYPES.map((t) => {
      const list = activeCats.filter((c) => c.type === t);
      return Math.max(list.reduce((s, c) => s + Number(c.ideal_plan_amount), 0), list.reduce((s, c) => s + c.soFar, 0));
    })
  );

  return (
    <div className="card">
      <h3>Expense Breakdown <span className="sub">Blue = spent within plan, red = over, grey = remaining</span></h3>
      <div className="heat-list">
        {TYPES.map((type) => {
          const typeCats = activeCats.filter((c) => c.type === type);
          if (typeCats.length === 0) return null;
          const isOpen = !!open[type];
          const typeSpent = typeCats.reduce((s, c) => s + c.soFar, 0);
          const typePlan = typeCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
          const typeWithinPlan = Math.min(typeSpent, typePlan);
          const typeOver = Math.max(0, typeSpent - typePlan);
          const typeRemaining = Math.max(0, typePlan - typeSpent);
          const typeOverFlag = typeOver > 0;

          return (
            <div key={type}>
              <div className="heat-row" onClick={() => toggle(type)} style={{ cursor: "pointer", fontWeight: 700 }}>
                <div className="cat-name">
                  <span style={{ display: "inline-block", width: 12, transition: "transform 0.15s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                  {" "}{type}
                </div>
                <div className="bar-track bar-stacked">
                  <div className="bar-seg" style={{ width: `${(typeWithinPlan / typeScaleMax) * 100}%`, background: "linear-gradient(90deg,#93c5fd,#3b82f6)" }} />
                  {typeOverFlag && <div className="bar-seg" style={{ width: `${(typeOver / typeScaleMax) * 100}%`, background: "linear-gradient(90deg,#f87171,#dc2626)" }} />}
                  {!typeOverFlag && typeRemaining > 0 && <div className="bar-seg" style={{ width: `${(typeRemaining / typeScaleMax) * 100}%`, background: "#e5e7eb" }} />}
                </div>
                <div className="amt" style={{ color: typeOverFlag ? "#dc2626" : undefined }}>
                  {fmtCompact(typeSpent, currency)} / {fmtCompact(typePlan, currency)}
                </div>
              </div>

              {isOpen && typeCats.map((c) => {
                const plan = Number(c.ideal_plan_amount);
                const spentWithinPlan = Math.min(c.soFar, plan);
                const overAmount = Math.max(0, c.soFar - plan);
                const remaining = Math.max(0, plan - c.soFar);
                const over = overAmount > 0;
                return (
                  <div className="heat-row" key={c.id} style={{ paddingLeft: 18 }}>
                    <div className="cat-name" style={{ fontWeight: 500 }}>{c.name}</div>
                    <div className="bar-track bar-stacked">
                      <div className="bar-seg" style={{ width: `${(spentWithinPlan / heatScaleMax) * 100}%`, background: "linear-gradient(90deg,#93c5fd,#3b82f6)" }} />
                      {over && <div className="bar-seg" style={{ width: `${(overAmount / heatScaleMax) * 100}%`, background: "linear-gradient(90deg,#f87171,#dc2626)" }} />}
                      {!over && remaining > 0 && <div className="bar-seg" style={{ width: `${(remaining / heatScaleMax) * 100}%`, background: "#e5e7eb" }} />}
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