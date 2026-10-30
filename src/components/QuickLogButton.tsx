"use client";

import { useState, useTransition, useRef } from "react";
import { logTransaction } from "@/lib/actions";
import type { Category } from "@/lib/data";

export default function QuickLogButton({ categories, currency }: { categories: Category[]; currency: string }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !categoryId) return;
    const cat = categories.find((c) => c.id === categoryId);

    // Close the keyboard right away so the next tap on + works the first time
    amountRef.current?.blur();
    (document.activeElement as HTMLElement | null)?.blur();

    startTransition(async () => {
      await logTransaction(categoryId, amt);
      setToast(`Logged ${currency}${amt.toLocaleString("en-IN")} to ${cat?.name ?? "category"}`);
      setAmount("");
      setOpen(false);
      setTimeout(() => setToast(""), 2500);
    });
  }

  function toggleOpen() {
    (document.activeElement as HTMLElement | null)?.blur();
    setOpen((o) => !o);
  }

  if (categories.length === 0) return null;

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 104,
            right: 18,
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
            bottom: 104,
            right: 18,
            width: "min(420px, calc(100vw - 36px))",
            boxSizing: "border-box",
            background: "white",
            borderRadius: 12,
            padding: 12,
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
              flex: "1 1 auto",
              minWidth: 0,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: 16,
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span style={{ fontSize: 14, color: "#6b7280" }}>{currency}</span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            style={{
              flex: "0 0 84px",
              width: 84,
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 6px",
              fontSize: 16,
              touchAction: "manipulation",
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            style={{
              flex: "0 0 auto",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            Log
          </button>
        </form>
      )}

      <button
        className="fab-chat"
        onClick={toggleOpen}
        style={{
          position: "fixed",
          bottom: 24,
          right: 18,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.75)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          color: "white",
          fontSize: 34,
          boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          cursor: "pointer",
          zIndex: 60,
          lineHeight: 1,
          touchAction: "manipulation",
        }}
        aria-label={open ? "Close quick log" : "Quick log expense"}
      >
        {open ? "×" : "+"}
      </button>
    </>
  );
}