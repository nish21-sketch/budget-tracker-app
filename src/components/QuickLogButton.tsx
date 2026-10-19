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
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          }}
        >
          ✅ {toast}
        </div>
      )}

      {open && (
        <form
          onSubmit={submit}
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            background: "white",
            borderRadius: 12,
            padding: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            zIndex: 60,
            border: "1px solid #e5e7eb",
          }}
        >
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: 13,
              maxWidth: 140,
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{currency}</span>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: 13,
              width: 80,
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Log
          </button>
        </form>
      )}

      <button
        className="fab-chat"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--accent)",
          color: "white",
          fontSize: 28,
          border: "none",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          cursor: "pointer",
          zIndex: 60,
          lineHeight: 1,
        }}
        aria-label={open ? "Close quick log" : "Quick log expense"}
      >
        {open ? "×" : "+"}
      </button>
    </>
  );
}