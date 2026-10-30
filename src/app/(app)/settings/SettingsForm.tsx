"use client";

import { useState, useTransition } from "react";
import { updateIncome, upsertCategory, deleteCategory, moveCategory } from "@/lib/actions";
import { CATEGORY_TYPES, CategoryType } from "@/lib/categories";
import { fmt } from "@/lib/utils";
import type { Category } from "@/lib/data";
import { FREQUENCY_OPTIONS, Frequency, dueMonthOptions, defaultDueMonth, frequencyTag } from "@/lib/frequency";

const smallLabel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  fontSize: 11,
  color: "var(--muted)",
};

const fieldLabel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: "var(--muted)",
  flex: "1 1 140px",
  minWidth: 0,
};

const ctl: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 10px",
  fontSize: 16,
  background: "white",
  minWidth: 0,
};

const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };

const bubble: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1px solid var(--border)",
  background: "white",
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

export default function SettingsForm({
  categories,
  income,
  currency,
}: {
  categories: Category[];
  income: number;
  currency: string;
}) {
  const [incomeVal, setIncomeVal] = useState(income);
  const [cats, setCats] = useState(categories);
  const [isPending, startTransition] = useTransition();
  const [newCat, setNewCat] = useState({
    name: "",
    type: "Personal" as CategoryType,
    idealPlanAmount: 0,
    hasEndDate: false,
    endDate: "",
    frequency: "monthly" as Frequency,
    dueMonth: "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function saveIncome() {
    startTransition(async () => {
      await updateIncome(incomeVal);
    });
  }

  function saveCategory(c: Category) {
    const freq = c.frequency ?? "monthly";
    startTransition(async () => {
      await upsertCategory(c.id, {
        name: c.name,
        type: c.type,
        idealPlanAmount: Number(c.ideal_plan_amount),
        endDate: c.end_date,
        frequency: freq,
        dueMonth: freq === "monthly" ? null : c.due_month ?? defaultDueMonth(),
      });
    });
  }

  function removeCategory(id: string) {
    setCats((prev) => prev.filter((c) => c.id !== id));
    startTransition(async () => {
      await deleteCategory(id);
    });
  }

  function addCategory() {
    if (!newCat.name.trim()) return;
    startTransition(async () => {
      await upsertCategory(null, {
        name: newCat.name,
        type: newCat.type,
        idealPlanAmount: newCat.idealPlanAmount,
        endDate: newCat.hasEndDate ? newCat.endDate || null : null,
        frequency: newCat.frequency,
        dueMonth: newCat.frequency === "monthly" ? null : newCat.dueMonth || defaultDueMonth(),
      });
      setNewCat({
        name: "",
        type: "Personal",
        idealPlanAmount: 0,
        hasEndDate: false,
        endDate: "",
        frequency: "monthly",
        dueMonth: "",
      });
      setShowAdd(false);
    });
  }

  function changeFrequency(i: number, f: Frequency) {
    setCats((prev) =>
      prev.map((x, idx) =>
        idx === i
          ? { ...x, frequency: f, due_month: f === "monthly" ? null : x.due_month ?? defaultDueMonth() }
          : x
      )
    );
  }

  function move(id: string, dir: "up" | "down", idx: number) {
    setCats((prev) => {
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    startTransition(async () => {
      await moveCategory(id, dir);
    });
  }

  return (
    <div>
      <h2 style={{ margin: "4px 0 14px", fontSize: 18 }}>Settings</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Monthly Income</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="currency">{currency}</span>
          <input
            type="number"
            value={incomeVal || ""}
            onChange={(e) => setIncomeVal(parseFloat(e.target.value) || 0)}
            style={{ width: 160, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
          />
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={saveIncome} disabled={isPending}>
            Save
          </button>
        </div>
      </div>

      <div className="card">
        <h3>
          Categories <span className="sub">Tap a category to see or change its details.</span>
        </h3>
        {cats.map((c, i) => {
          const isOpen = expandedId === c.id;
          const tag = frequencyTag(c.frequency);
          const freq = c.frequency ?? "monthly";
          return (
            <div key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <button
                onClick={() => setExpandedId(isOpen ? null : c.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 13 }}>
                  {fmt(Number(c.ideal_plan_amount), currency)}
                  {tag ? ` · ${tag}` : ""}
                  <span>{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>

              {isOpen && (
                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 14,
                    margin: "0 0 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <label style={fieldLabel}>
                    Name
                    <input
                      type="text"
                      value={c.name}
                      style={ctl}
                      onChange={(e) =>
                        setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                      }
                    />
                  </label>

                  <div style={row}>
                    <label style={fieldLabel}>
                      Group
                      <select
                        value={c.type}
                        style={ctl}
                        onChange={(e) =>
                          setCats((prev) =>
                            prev.map((x, idx) => (idx === i ? { ...x, type: e.target.value as CategoryType } : x))
                          )
                        }
                      >
                        {CATEGORY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={fieldLabel}>
                      Plan amount
                      <input
                        type="number"
                        inputMode="decimal"
                        value={c.ideal_plan_amount || ""}
                        style={ctl}
                        onChange={(e) =>
                          setCats((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, ideal_plan_amount: parseFloat(e.target.value) || 0 } : x
                            )
                          )
                        }
                      />
                    </label>
                  </div>

                  <div style={row}>
                    <label style={fieldLabel}>
                      Repeats
                      <select
                        value={freq}
                        style={ctl}
                        onChange={(e) => changeFrequency(i, e.target.value as Frequency)}
                      >
                        {FREQUENCY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {freq !== "monthly" && (
                      <label style={fieldLabel}>
                        First due
                        <select
                          value={c.due_month ?? defaultDueMonth()}
                          style={ctl}
                          onChange={(e) =>
                            setCats((prev) =>
                              prev.map((x, idx) => (idx === i ? { ...x, due_month: e.target.value } : x))
                            )
                          }
                        >
                          {dueMonthOptions(c.due_month).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={c.end_date !== null}
                        onChange={(e) =>
                          setCats((prev) =>
                            prev.map((x, idx) => (idx === i ? { ...x, end_date: e.target.checked ? "" : null } : x))
                          )
                        }
                      />
                      End date
                    </label>
                    {c.end_date !== null && (
                      <input
                        type="date"
                        value={c.end_date ?? ""}
                        style={{ ...ctl, width: "auto" }}
                        onChange={(e) =>
                          setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, end_date: e.target.value } : x)))
                        }
                      />
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: "auto", padding: "8px 16px" }}
                      onClick={() => saveCategory(c)}
                      disabled={isPending}
                    >
                      Save
                    </button>
                    <button className="remove-btn" onClick={() => removeCategory(c.id)}>
                      remove
                    </button>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        aria-label="Move up"
                        style={{ ...bubble, opacity: i === 0 ? 0.35 : 1 }}
                        disabled={i === 0}
                        onClick={() => move(c.id, "up", i)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        style={{ ...bubble, opacity: i === cats.length - 1 ? 0.35 : 1 }}
                        disabled={i === cats.length - 1}
                        onClick={() => move(c.id, "down", i)}
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {showAdd ? (
          <div className="cat-edit-row" style={{ borderBottom: "none" }}>
            <input
              type="text"
              placeholder="New category name"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            />
            <select
              value={newCat.type}
              onChange={(e) => setNewCat({ ...newCat, type: e.target.value as CategoryType })}
            >
              {CATEGORY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Plan"
              value={newCat.idealPlanAmount || ""}
              onChange={(e) => setNewCat({ ...newCat, idealPlanAmount: parseFloat(e.target.value) || 0 })}
            />
            <label style={smallLabel}>
              Repeats
              <select
                value={newCat.frequency}
                onChange={(e) =>
                  setNewCat({
                    ...newCat,
                    frequency: e.target.value as Frequency,
                    dueMonth: e.target.value === "monthly" ? "" : newCat.dueMonth || defaultDueMonth(),
                  })
                }
              >
                {FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {newCat.frequency !== "monthly" && (
              <label style={smallLabel}>
                First due
                <select
                  value={newCat.dueMonth || defaultDueMonth()}
                  onChange={(e) => setNewCat({ ...newCat, dueMonth: e.target.value })}
                >
                  {dueMonthOptions(newCat.dueMonth).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={newCat.hasEndDate}
                onChange={(e) => setNewCat({ ...newCat, hasEndDate: e.target.checked })}
              />
              End date
            </label>
            {newCat.hasEndDate && (
              <input
                type="date"
                value={newCat.endDate}
                onChange={(e) => setNewCat({ ...newCat, endDate: e.target.value })}
              />
            )}
            <button
              className="btn btn-primary"
              style={{ width: "auto", padding: "6px 12px" }}
              onClick={addCategory}
              disabled={isPending}
            >
              Add
            </button>
          </div>
        ) : (
          <button className="add-cat-btn" onClick={() => setShowAdd(true)}>
            + Add category
          </button>
        )}
      </div>
    </div>
  );
}