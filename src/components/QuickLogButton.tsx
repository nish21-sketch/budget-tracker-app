"use client";

import { useState, useTransition } from "react";
import { logTransaction } from "@/lib/actions";
import type { Category } from "@/lib/data";

export default function QuickLogButton({ categories, currency }: { categories: Category[]; currency: string }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !categoryId) return;
    const cat = categories.find((c) => c.id === categoryId);

    startTransition(async () => {
      await logTransaction(categoryId, amt);
      setToast(`Logged ${currency}${amt.toLocaleString("en-IN")} to ${cat?.name ?? "category"}`);
      setAmount("");
      setOpen(false);
      setTimeout(() => setToast(""), 2500);
    });
  }

  if (categories.length === 0) return null;

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            background: "#111827",
            color: "white",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            zIndex: 60,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
        >
          ✅ {toast}
        </div>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 280,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            padding: 16,
            zIndex: 60,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Quick log an expense</div>
          <form onSubmit={submit}>
            <div className="field">
              <label>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${currency}0`}
              />
            </div>
            <button className="btn btn-primary" disabled={isPending}>
              {isPending ? "Saving…" : "Log it"}
            </button>
          </form>
        </div>
      )}

      <button
        className="fab-chat"
        onClick={() => setOpen((v) => !v)}
        title="Quick log an expense"
        style={{ zIndex: 61 }}
      >
        {open ? "×" : "+"}
      </button>
    </>
  );
}
