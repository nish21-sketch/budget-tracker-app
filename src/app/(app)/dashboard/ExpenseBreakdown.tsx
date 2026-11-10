"use client";

import { useState } from "react";
import type { Category } from "@/lib/data";

const TYPES = ["Fixed Deduction", "Fluid Essential", "Personal", "Investment"] as const;

type CatWithSoFar = Category & { soFar: number };

function money(n: number, currency: string) {
  return currency + Math.round(n).toLocaleString("en-IN");
}

function Figures({
  plan,
  spent,
  currency,
  good = false,
}: {
  plan: number;
  spent: number;
  currency: string;
  good?: boolean;
}) {
  const over = spent > plan;
  // For investments, going over plan is a good thing, so it stays green
  const bad = over && !good;
  const color = bad ? "#dc2626" : "#16a34a";
  let badge: string | null = null;
  if (plan > 0) {
    badge = over
      ? `▲${Math.max(1, Math.round(((spent - plan) / plan) * 100))}%`
      : `${Math.round((spent / plan) * 100)}%`;
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      <span>
        <span style={{ color }}>{money(spent, currency)}</span>
        <span style={{ color: "#111827" }}> / {money(plan, currency)}</span>
      </span>
      {badge && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1.2,
            padding: "1px 5px",
            borderRadius: 999,
            color,
            background: bad ? "#fef2f2" : "#f0fdf4",
          }}
        >
          {badge}
        </span>
      )}
    </span>
  );
}

export default function ExpenseBreakdown({ cats, currency }: { cats: CatWithSoFar[]; currency: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(type: string) {
    setOpen((o) => ({ ...o, [type]: !o[type] }));
  }

  // Rows listed are only categories with spend, but budgets always count every category.
  const activeCats = cats.filter((c) => c.soFar > 0);
  const grandSpent = cats.reduce((s, c) => s + c.soFar, 0);
  const grandPlan = cats.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);

  return (
    <div className="card">
      <h3>
        Expense Breakdown <span className="sub">Tap a group to open it</span>
      </h3>

      {activeCats.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Nothing spent in this cycle yet.</div>
      )}

      {TYPES.map((type) => {
        const typeActive = activeCats.filter((c) => c.type === type);
        if (typeActive.length === 0) return null;
        const typeAll = cats.filter((c) => c.type === type);
        const isOpen = !!open[type];
        const typeSpent = typeAll.reduce((s, c) => s + c.soFar, 0);
        const typePlan = typeAll.reduce((s, c) => s + Number(c.ideal_plan_amount), 0);
        const isInvest = type === "Investment";

        return (
          <div key={type} style={{ borderBottom: "1px solid #f1f2f6" }}>
            <div
              onClick={() => toggle(type)}
              style={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "14px 2px",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    transition: "transform 0.15s",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ›
                </span>
                {type}
              </span>
              <Figures plan={typePlan} spent={typeSpent} currency={currency} good={isInvest} />
            </div>

            {isOpen && (
              <div style={{ paddingBottom: 8 }}>
                {typeActive.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 0 9px 16px",
                      borderTop: "1px dashed #eef0f4",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </span>
                    <Figures
                      plan={Number(c.ideal_plan_amount)}
                      spent={c.soFar}
                      currency={currency}
                      good={isInvest}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {activeCats.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "14px 2px 2px",
            marginTop: 2,
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 14 }}>Total</span>
          <Figures plan={grandPlan} spent={grandSpent} currency={currency} />
        </div>
      )}
    </div>
  );
}