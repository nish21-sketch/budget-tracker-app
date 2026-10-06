"use client";

import { useState, useTransition } from "react";
import { updateIncome, upsertCategory, deleteCategory, moveCategory } from "@/lib/actions";
import { CATEGORY_TYPES, CategoryType } from "@/lib/categories";
import { fmt } from "@/lib/utils";
import type { Category } from "@/lib/data";

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
  const [newCat, setNewCat] = useState({ name: "", type: "Personal" as CategoryType, idealPlanAmount: 0, hasEndDate: false, endDate: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function saveIncome() {
    startTransition(async () => {
      await updateIncome(incomeVal);
    });
  }

  function saveCategory(c: Category) {
    startTransition(async () => {
      await upsertCategory(c.id, {
        name: c.name,
        type: c.type,
        idealPlanAmount: Number(c.ideal_plan_amount),
        endDate: c.end_date,
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
      });
      setNewCat({ name: "", type: "Personal", idealPlanAmount: 0, hasEndDate: false, endDate: "" });
      setShowAdd(false);
    });
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
        <h3>Categories <span className="sub">Tap a category to see or change its details.</span></h3>
        {cats.map((c, i) => {
          const isOpen = expandedId === c.id;
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
                  <span>{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>

              {isOpen && (
                <div className="cat-edit-row" style={{ borderBottom: "none", paddingTop: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <button className="remove-btn" style={{ color: "var(--muted)" }} disabled={i === 0} onClick={() => move(c.id, "up", i)}>▲</button>
                    <button className="remove-btn" style={{ color: "var(--muted)" }} disabled={i === cats.length - 1} onClick={() => move(c.id, "down", i)}>▼</button>
                  </div>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <select
                    value={c.type}
                    onChange={(e) => setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, type: e.target.value as CategoryType } : x)))}
                  >
                    {CATEGORY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={c.ideal_plan_amount || ""}
                    onChange={(e) => setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, ideal_plan_amount: parseFloat(e.target.value) || 0 } : x)))}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={c.end_date !== null}
                      onChange={(e) =>
                        setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, end_date: e.target.checked ? "" : null } : x)))
                      }
                    />
                    End date
                  </label>
                  {c.end_date !== null && (
                    <input
                      type="date"
                      value={c.end_date ?? ""}
                      onChange={(e) => setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, end_date: e.target.value } : x)))}
                    />
                  )}
                  <button className="btn btn-secondary" style={{ width: "auto", padding: "6px 12px" }} onClick={() => saveCategory(c)} disabled={isPending}>
                    Save
                  </button>
                  <button className="remove-btn" onClick={() => removeCategory(c.id)}>remove</button>
                </div>
              )}
            </div>
          );
        })}

        {showAdd ? (
          <div className="cat-edit-row" style={{ borderBottom: "none" }}>
            <input type="text" placeholder="New category name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
            <select value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as CategoryType })}>
              {CATEGORY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input type="number" placeholder="Plan" value={newCat.idealPlanAmount || ""} onChange={(e) => setNewCat({ ...newCat, idealPlanAmount: parseFloat(e.target.value) || 0 })} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={newCat.hasEndDate} onChange={(e) => setNewCat({ ...newCat, hasEndDate: e.target.checked })} />
              End date
            </label>
            {newCat.hasEndDate && (
              <input type="date" value={newCat.endDate} onChange={(e) => setNewCat({ ...newCat, endDate: e.target.value })} />
            )}
            <button className="btn btn-primary" style={{ width: "auto", padding: "6px 12px" }} onClick={addCategory} disabled={isPending}>
              Add
            </button>
          </div>
        ) : (
          <button className="add-cat-btn" onClick={() => setShowAdd(true)}>+ Add category</button>
        )}
      </div>
    </div>
  );
}
