"use client";

import { useState, useTransition } from "react";
import { updateCategoryBudget } from "@/lib/actions";
import { fmt } from "@/lib/utils";

export type Suggestion = {
  id: string;
  name: string;
  plan: number;
  usual: number;
  suggested: number;
};

export default function BudgetCheck({
  suggestions,
  currency,
}: {
  suggestions: Suggestion[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (suggestions.length === 0) return null;

  const pending = suggestions.filter((s) => !applied[s.id]).length;

  function apply(s: Suggestion) {
    setBusy(s.id);
    startTransition(async () => {
      const r = await updateCategoryBudget(s.id, s.suggested);
      if (r.ok) setApplied((a) => ({ ...a, [s.id]: true }));
      setBusy(null);
    });
  }

  return (
    <div className="card" style={{ marginBottom: 12, padding: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <span>
          Budget check ·{" "}
          {pending > 0
            ? `${pending} suggestion${pending === 1 ? "" : "s"}`
            : "all up to date ✓"}
        </span>
        <span style={{ color: "#9ca3af" }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Based on the middle value of your last 3 months.
          </div>
          {suggestions.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  You usually spend {fmt(s.usual, currency)} · budget {fmt(s.plan, currency)}
                </div>
              </div>
              {applied[s.id] ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>Updated ✓</span>
              ) : (
                <button
                  type="button"
                  disabled={busy === s.id}
                  onClick={() => apply(s)}
                  style={{
                    padding: "7px 12px",
                    background: "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    opacity: busy === s.id ? 0.6 : 1,
                  }}
                >
                  Update to {fmt(s.suggested, currency)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}