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
  const [submitting, setSubmitting] = useState(false);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", type: "Personal", idealPlanAmount: 0, endDate: null }]);
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
            <h3>Your categories <span className="sub">Edit, remove, or add — this is just a starting point</span></h3>
            {rows.map((r, i) => (
              <div className="cat-edit-row" key={i}>
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                  placeholder="Category name"
                />
                <select value={r.type} onChange={(e) => updateRow(i, { type: e.target.value as CategoryType })}>
                  {CATEGORY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={r.idealPlanAmount || ""}
                  onChange={(e) => updateRow(i, { idealPlanAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="Plan ₹"
                />
                {r.type === "Fixed Deduction" && (
                  <input
                    type="date"
                    value={r.endDate ?? ""}
                    onChange={(e) => updateRow(i, { endDate: e.target.value || null })}
                    title="End date (for EMIs/loans only)"
                  />
                )}
                <button className="remove-btn" onClick={() => removeRow(i)}>remove</button>
              </div>
            ))}
            <button className="add-cat-btn" onClick={addRow}>+ Add category</button>
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
