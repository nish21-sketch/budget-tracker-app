"use client";

import { useState, useTransition } from "react";
import { updateIncome, upsertCategory, deleteCategory } from "@/lib/actions";
import { CATEGORY_TYPES, CategoryType } from "@/lib/categories";
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
  const [newCat, setNewCat] = useState({ name: "", type: "Personal" as CategoryType, idealPlanAmount: 0, endDate: "" });

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
        endDate: newCat.endDate || null,
      });
      setNewCat({ name: "", type: "Personal", idealPlanAmount: 0, endDate: "" });
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
        <h3>Categories</h3>
        {cats.map((c, i) => (
          <div className="cat-edit-row" key={c.id}>
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
            {c.type === "Fixed Deduction" && (
              <input
                type="date"
                value={c.end_date ?? ""}
                onChange={(e) => setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, end_date: e.target.value || null } : x)))}
              />
            )}
            <button className="btn btn-secondary" style={{ width: "auto", padding: "6px 12px" }} onClick={() => saveCategory(c)} disabled={isPending}>
              Save
            </button>
            <button className="remove-btn" onClick={() => removeCategory(c.id)}>remove</button>
          </div>
        ))}

        <div className="cat-edit-row" style={{ borderBottom: "none" }}>
          <input type="text" placeholder="New category name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
          <select value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as CategoryType })}>
            {CATEGORY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input type="number" placeholder="Plan" value={newCat.idealPlanAmount || ""} onChange={(e) => setNewCat({ ...newCat, idealPlanAmount: parseFloat(e.target.value) || 0 })} />
          {newCat.type === "Fixed Deduction" && (
            <input type="date" value={newCat.endDate} onChange={(e) => setNewCat({ ...newCat, endDate: e.target.value })} />
          )}
        </div>
        <button className="add-cat-btn" onClick={addCategory} disabled={isPending}>+ Add category</button>
      </div>
    </div>
  );
}
