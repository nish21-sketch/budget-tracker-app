"use client";

import { useState, useTransition } from "react";
import { logTransaction, deleteTransaction } from "@/lib/actions";
import { fmt } from "@/lib/utils";
import type { Category } from "@/lib/data";

type CategoryWithSoFar = Category & { soFar: number };

type RecentRow = {
  id: string;
  amount: number;
  note: string | null;
  logged_at: string;
  category_id: string;
  categories: { name: string } | { name: string }[] | null;
};

function catNameFromRow(row: RecentRow): string {
  if (!row.categories) return "—";
  return Array.isArray(row.categories) ? (row.categories[0]?.name ?? "—") : row.categories.name;
}

const PAGE_SIZE = 10;

export default function LogForm({
  categories,
  currency,
  initialRecent,
}: {
  categories: CategoryWithSoFar[];
  currency: string;
  initialRecent: RecentRow[];
}) {
  const [cats, setCats] = useState(categories);
  const [recent, setRecent] = useState<RecentRow[]>(initialRecent);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function submitFor(cat: CategoryWithSoFar) {
    const amt = parseFloat(inputs[cat.id] ?? "");
    if (!amt || amt <= 0) return;
    const note = notes[cat.id]?.trim() || undefined;

    setCats((prev) => prev.map((c) => (c.id === cat.id ? { ...c, soFar: c.soFar + amt } : c)));
    setInputs((prev) => ({ ...prev, [cat.id]: "" }));
    setNotes((prev) => ({ ...prev, [cat.id]: "" }));

    startTransition(async () => {
      const inserted = await logTransaction(cat.id, amt, note);
      if (inserted) {
        setRecent((prev) => [
          { id: inserted.id, amount: inserted.amount, note: inserted.note, logged_at: inserted.logged_at, category_id: cat.id, categories: { name: cat.name } },
          ...prev,
        ]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cat: CategoryWithSoFar) {
    if (e.key !== "Enter") return;
    submitFor(cat);
  }

  function removeRecent(row: RecentRow) {
    setRemovingId(row.id);
    setCats((prev) => prev.map((c) => (c.id === row.category_id ? { ...c, soFar: Math.max(0, c.soFar - Number(row.amount)) } : c)));
    setRecent((prev) => prev.filter((r) => r.id !== row.id));
    startTransition(async () => {
      await deleteTransaction(row.id);
      setRemovingId(null);
    });
  }

  const visibleRecent = recent.slice(0, visibleCount);
  const hasMore = visibleCount < recent.length;

  return (
    <div className="log-wrap">
      <div className="log-header">
        <h1>Log an expense</h1>
        <p>Type an amount and an optional note, then tap Add.</p>
      </div>

      <div className="log-list">
        {cats.length === 0 && (
          <div className="log-row"><span style={{ color: "var(--muted)" }}>No categories yet — add some in Settings.</span></div>
        )}
        {cats.map((c) => {
          const over = c.soFar > Number(c.ideal_plan_amount) && Number(c.ideal_plan_amount) > 0;
          return (
            <div
              className={`log-row ${over ? "over" : ""}`}
              key={c.id}
              style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 6, overflowX: "auto", padding: "8px 0" }}
            >
              <div className="cat" style={{ flex: "1 1 70px", minWidth: 60, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.name}
                <span className="so-far" style={{ display: "block", fontSize: 11 }}>
                  So far: {fmt(c.soFar, currency)}{over ? " — over" : ""}
                </span>
              </div>
              <input
                type="text"
                placeholder="Note"
                value={notes[c.id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                disabled={isPending}
                style={{
                  flex: "0 0 70px",
                  width: 70,
                  boxSizing: "border-box",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "6px 6px",
                  fontSize: 11,
                }}
              />
              <div className="log-input-wrap" style={{ flex: "0 0 auto" }}>
                <span className="currency">{currency}</span>
                <input
                  className="log-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={inputs[c.id] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, c)}
                  disabled={isPending}
                  style={{ boxSizing: "border-box", width: 60 }}
                />
              </div>
              <button
                type="button"
                onClick={() => submitFor(c)}
                disabled={isPending}
                style={{
                  flex: "0 0 auto",
                  background: "var(--accent, #6366f1)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          );
        })}
      </div>

      <div className="recent-box">
        <h4>Recent logs</h4>
        {visibleRecent.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Nothing logged yet.</div>
        ) : (
          <>
            {visibleRecent.map((r) => (
              <div
                className="recent-item"
                key={r.id}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, opacity: removingId === r.id ? 0.5 : 1 }}
              >
                <span>
                  {catNameFromRow(r)} — {fmt(Number(r.amount), currency)}
                  {r.note ? <span style={{ color: "#9ca3af" }}> · {r.note}</span> : null}
                  <span style={{ color: "#9ca3af" }}> · {new Date(r.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeRecent(r)}
                  disabled={isPending}
                  style={{
                    border: "1px solid #fca5a5",
                    color: "#dc2626",
                    background: "white",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                style={{
                  width: "100%",
                  marginTop: 8,
                  background: "none",
                  border: "1px dashed #d1d5db",
                  borderRadius: 8,
                  padding: "8px",
                  fontSize: 12,
                  color: "var(--accent, #6366f1)",
                  cursor: "pointer",
                }}
              >
                Show 10 more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}