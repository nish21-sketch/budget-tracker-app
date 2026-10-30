"use client";

import { useRef, useState, useTransition } from "react";
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
  margin: "12px 0 2px",
};

const arrowBtn: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "white",
  borderRadius: 999,
  width: 26,
  height: 26,
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
};

function Pager({ items, size = 3 }: { items: React.ReactNode[]; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const pages: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));

  function onScroll() {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(p: number) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <style>{`.pager::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={ref}
        onScroll={onScroll}
        className="pager"
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
        }}
      >
        {pages.map((p, i) => (
          <div key={i} style={{ flex: "0 0 100%", minWidth: 0, scrollSnapAlign: "start" }}>
            {p}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 8 }}>
          <button type="button" aria-label="Previous" onClick={() => go(Math.max(0, page - 1))} disabled={page === 0} style={{ ...arrowBtn, opacity: page === 0 ? 0.4 : 1 }}>
            ‹
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {pages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: i === page ? "var(--accent, #6366f1)" : "#d1d5db",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(Math.min(pages.length - 1, page + 1))}
            disabled={page === pages.length - 1}
            style={{ ...arrowBtn, opacity: page === pages.length - 1 ? 0.4 : 1 }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

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

  // Unpaid bills first (based on saved data, so rows don't jump while you tap)
  const sortedBills = [...bills].sort(
    (a, b) => (remainingOf(a) > 0 ? 0 : 1) - (remainingOf(b) > 0 ? 0 : 1)
  );

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

  const billItems = sortedBills.map((b) => {
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
          padding: "6px 0",
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
            <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 12 }}>
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
                  padding: "2px 7px",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                Undo
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <input
              type="number"
              inputMode="decimal"
              value={amounts[b.id] ?? String(rem)}
              onChange={(e) => setAmounts((a) => ({ ...a, [b.id]: e.target.value }))}
              style={{
                width: 70,
                boxSizing: "border-box",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "5px 6px",
                fontSize: 13,
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
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 12,
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
  });

  const upcomingItems = upcoming.map((u) => (
    <div
      key={u.id}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
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
  ));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <div>
          <h3 style={{ margin: 0 }}>Bills &amp; Investments</h3>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Tap Paid when you&apos;ve paid one</div>
        </div>
        {bills.length > 0 && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9ca3af" }}>
              To pay this cycle
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: stillToPay > 0 ? "#111827" : "#16a34a" }}>
              {stillToPay > 0 ? fmt(stillToPay, currency) : "All paid ✓"}
            </div>
          </div>
        )}
      </div>

      {billItems.length > 0 && <Pager items={billItems} size={3} />}

      {upcomingItems.length > 0 && (
        <>
          <div style={sectionTitle}>Coming up</div>
          <Pager items={upcomingItems} size={3} />
        </>
      )}
    </div>
  );
}