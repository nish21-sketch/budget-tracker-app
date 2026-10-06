"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_CATEGORIES, CATEGORY_TYPES, CategoryType } from "@/lib/categories";
import { completeOnboarding } from "@/lib/actions";

type Row = { name: string; type: CategoryType; idealPlanAmount: number; endDate: string | null };

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState("₹");
  const [income, setIncome] = useState(0);
  const [rows, setRows] = useState<Row[]>(
    DEFAULT_CATEGORIES.map((c) => ({ name: c.name, type: c.type, idealPlanAmount: 0, endDate: null }))
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow(type: CategoryType) {
    setRows((prev) => [...prev, { name: "", type, idealPlanAmount: 0, endDate: null }]);
  }

  function moveRow(i: number, dir: -1 | 1) {
    setRows((prev) => {
      const target = i + dir;
      if (target < 0 || target >= prev.length || prev[target].type !== prev[i].type) return prev;
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  }

  async function finish() {
    setSubmitting(true);
    await completeOnboarding(currency, income, rows.filter((r) => r.name.trim() !== ""));
    router.push("/dashboard");
  }

  return (
    <div className="centered-wrap" style={{ alignItems: "flex-start", paddingTop: 48 }}>
      <div className="wizard-card" style={{ width: "100%" }}>
        <div className="wizard-steps">
          {[0, 1, 2].map((s) => (
            <span key={s} className={`wizard-dot ${s === step ? "active" : ""}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="card">
            <h3>Welcome — let&apos;s set a few things up</h3>
            <div className="field">
              <label>Currency symbol</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
            <div className="field">
              <label>Monthly income</label>
              <input
                type="number"
                value={income || ""}
                onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                placeholder="60000"
              />
            </div>
            <button className="btn btn-primary" onClick={() => setStep(1)}>
              Next
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="card">
            <h3>
              Your categories{" "}
              <span className="sub">Tap a group to expand it. Everything&apos;s editable, nothing&apos;s final.</span>
            </h3>
            {CATEGORY_TYPES.map((type) => {
              const groupRows = rows
                .map((r, idx) => ({ r, idx }))
                .filter(({ r }) => r.type === type);
              const isOpen = !!openGroups[type];
              return (
                <div key={type} style={{ marginBottom: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                  <button
                    onClick={() => setOpenGroups((p) => ({ ...p, [type]: !p[type] }))}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <span>{type} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({groupRows.length})</span></span>
                    <span>{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 14px 12px" }}>
                      {groupRows.map(({ r, idx }, posInGroup) => (
                        <div className="cat-edit-row" key={idx}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <button className="remove-btn" style={{ color: "var(--muted)" }} disabled={posInGroup === 0} onClick={() => moveRow(idx, -1)}>▲</button>
                            <button className="remove-btn" style={{ color: "var(--muted)" }} disabled={posInGroup === groupRows.length - 1} onClick={() => moveRow(idx, 1)}>▼</button>
                          </div>
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) => updateRow(idx, { name: e.target.value })}
                            placeholder="Category name"
                          />
                          <input
                            type="number"
                            value={r.idealPlanAmount || ""}
                            onChange={(e) => updateRow(idx, { idealPlanAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="Plan ₹"
                          />
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                            <input
                              type="checkbox"
                              checked={r.endDate !== null}
                              onChange={(e) => updateRow(idx, { endDate: e.target.checked ? "" : null })}
                            />
                            End date
                          </label>
                          {r.endDate !== null && (
                            <input
                              type="date"
                              value={r.endDate}
                              onChange={(e) => updateRow(idx, { endDate: e.target.value })}
                            />
                          )}
                          <button className="remove-btn" onClick={() => removeRow(idx)}>remove</button>
                        </div>
                      ))}
                      <button className="add-cat-btn" onClick={() => addRow(type)}>+ Add to {type}</button>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setStep(0)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h3>Ready to go</h3>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              {rows.filter((r) => r.name.trim()).length} categories, {currency}
              {income.toLocaleString()} monthly income. You can change any of this later from Settings.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={finish} disabled={submitting}>
                {submitting ? "Setting up…" : "Finish & go to Dashboard"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
