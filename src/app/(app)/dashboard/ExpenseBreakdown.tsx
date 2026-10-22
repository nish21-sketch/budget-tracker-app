"use client";

import { useState } from "react";
import { fmtCompact } from "@/lib/utils";
import type { Category } from "@/lib/data";

const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;
const BAR_HEIGHT = 90;

type CatWithSoFar = Category & { soFar: number };

export default function ExpenseBreakdown({ cats, currency }: { cats: CatWithSoFar[]; currency: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(type: string) {
    setOpen((o) => ({ ...o, [type]: !o[type] }));
  }

  const heatScaleMax = Math.max(1, ...cats.map((c) => Math.max(Number(c.ideal_plan_amount), c.soFar)));

  return (
    <div className="card">
      <h3>Expense Breakdown <span className="sub">Blue = spent within plan, red = over, grey = remaining</span></h3>
      <div>
        {TYPES.map((type) => {
          const typeCats = cats.filter((c) => c.type === type);
          if (typeCats.length === 0) return null;
          const isOpen = !!open[type];
          const typeSpent = typeCats.reduce((s, c) => s + c.soFar, 0);
          const typePlan = typeCats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
          return (
            <div key={type} style={{ marginBottom: 10 }}>
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
              {isOpen && (
                <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingTop: 6, paddingBottom: 4 }}>
                  {typeCats.map((c) => {
                    const plan = Number(c.ideal_plan_amount);
                    const spentWithinPlan = Math.min(c.soFar, plan);
                    const overAmount = Math.max(0, c.soFar - plan);
                    const remaining = Math.max(0, plan - c.soFar);
                    const over = overAmount > 0;
                    const blueH = (spentWithinPlan / heatScaleMax) * BAR_HEIGHT;
                    const redH = (overAmount / heatScaleMax) * BAR_HEIGHT;
                    const greyH = (remaining / heatScaleMax) * BAR_HEIGHT;
                    return (
                      <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 48, flexShrink: 0 }}>
                        <div
                          style={{
                            height: BAR_HEIGHT,
                            width: 22,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            background: "#f3f4f6",
                            borderRadius: 5,
                            overflow: "hidden",
                          }}
                        >
                          {over && <div style={{ height: redH, width: "100%", background: "linear-gradient(180deg,#dc2626,#f87171)" }} />}
                          {!over && greyH > 0 && <div style={{ height: greyH, width: "100%", background: "#e5e7eb" }} />}
                          <div style={{ height: blueH, width: "100%", background: "linear-gradient(180deg,#3b82f6,#93c5fd)" }} />
                        </div>
                        <div style={{ fontSize: 10, marginTop: 6, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 48 }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 9, color: over ? "#dc2626" : "#6b7280", marginTop: 2 }}>
                          {fmtCompact(c.soFar, currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}