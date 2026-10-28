"use client";

import { useState, useTransition } from "react";
import { logTransaction, deleteTransaction } from "@/lib/actions";
import { fmt } from "@/lib/utils";

export type BillRow = { id: string; name: string; plan: number; paid: number };
export type UpcomingRow = {
  id: string;
  name: string;
  amount: number;
  dueLabel: string;
  monthsAway: number;
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#9ca3af",
  margin: "10px 0 2px",
};

export default function BillsCard({
  bills,
  upcoming,
  currency,
}: {
  bills: BillRow[];
  upcoming: UpcomingRow[];
  currency: string;
}) {
  const [done, setDone] = useState<Record<string, { txId: string; amount: number }>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remainingOf(b: BillRow) {
    return Math.max(0, b.plan - b.paid);
  }

  const stillToPay = bills.reduce((s, b) => s + (done[b.id] ? 0 : remainingOf(b)), 0);

  function pay(b: BillRow) {
    const raw = amounts[b.id] ?? String(remainingOf(b));
    const amt = parseFloat(raw);
    if (!amt || amt <= 0) return;
    setBusyId(b.id);
    startTransition(async () => {
      const tx = await logTransaction(b.id, amt, "Marked as paid");
      if (tx) {
        setDone((d) => ({ ...d, [b.id]: { txId: tx.id, amount: amt } }));
        setAmounts((a) => {
          const n = { ...a };
          delete n[b.id];
          return n;
        });
      }
      setBusyId(null);
    });
  }

  function undo(billId: string) {
    const d = done[billId];
    if (!d) return;
    setDone((p) => {
      const n = { ...p };
      delete n[billId];
      return n;
    });
    startTransition(async () => {
      await deleteTransaction(d.txId);
    });
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>
        Bills <span className="sub">Tap Paid when you&apos;ve paid one</span>
      </h3>

      {bills.length > 0 && (
        <>
          <div style={sectionTitle}>To pay this cycle</div>
          <div style={{ fontSize: 12, color: stillToPay > 0 ? "#6b7280" : "#16a34a", marginBottom: 4 }}>
            {stillToPay > 0
              ? `${fmt(stillToPay, currency)} still to pay`
              : "All bills paid for this cycle ✓"}
          </div>
          {bills.map((b) => {
            const local = done[b.id];
            const rem = remainingOf(b);
            const isPaid = !!local || rem === 0;
            return (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f2f6",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    {!isPaid && b.paid > 0
                      ? `${fmt(b.paid, currency)} of ${fmt(b.plan, currency)} paid`
                      : `Planned ${fmt(b.plan, currency)}`}
                  </div>
                </div>

                {isPaid ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                    <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>
                      ✓ Paid {fmt(local ? local.amount : b.paid, currency)}
                    </span>
                    {local && (
                      <button
                        type="button"
                        onClick={() => undo(b.id)}
                        style={{
                          border: "1px solid #fca5a5",
                          color: "#dc2626",
                          background: "white",
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Undo
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amounts[b.id] ?? String(rem)}
                      onChange={(e) => setAmounts((a) => ({ ...a, [b.id]: e.target.value }))}
                      style={{
                        width: 84,
                        boxSizing: "border-box",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        padding: "7px 6px",
                        fontSize: 16,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => pay(b)}
                      disabled={busyId === b.id}
                      style={{
                        background: "var(--accent, #6366f1)",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        padding: "9px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Paid
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div style={sectionTitle}>Coming up</div>
          {upcoming.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                padding: "8px 0",
                borderBottom: "1px solid #f1f2f6",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  Due {u.dueLabel} · {u.monthsAway === 1 ? "next month" : `in ${u.monthsAway} months`}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(u.amount, currency)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}