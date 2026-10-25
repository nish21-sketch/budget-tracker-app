"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCycleInfo, startNextCycle, undoEarlyCycle } from "@/lib/actions";

type CycleInfo = Awaited<ReturnType<typeof getCycleInfo>>;

const menuBtn: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  padding: "9px 6px",
  fontSize: 13,
  cursor: "pointer",
  borderRadius: 8,
};

export default function CycleSwitcher({ fallbackLabel }: { fallbackLabel: string }) {
  const router = useRouter();
  const [info, setInfo] = useState<CycleInfo>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    getCycleInfo().then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  function start() {
    if (!info) return;
    if (!window.confirm(`Start the ${info.nextLabel} cycle now? New expenses will be logged to it.`)) return;
    startTransition(async () => {
      await startNextCycle();
      load();
      router.refresh();
      setOpen(false);
    });
  }

  function undo() {
    if (!info) return;
    if (!window.confirm(`Go back to ${info.backLabel}? Anything already logged in ${info.activeLabel} stays under ${info.activeLabel}.`)) return;
    startTransition(async () => {
      await undoEarlyCycle();
      load();
      router.refresh();
      setOpen(false);
    });
  }

  function view(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div className="month-pill">📅 {info?.activeLabel ?? fallbackLabel}</div>
      <button
        type="button"
        onClick={() => {
          if (!open) load();
          setOpen((o) => !o);
        }}
        style={{
          border: "1px solid #e5e7eb",
          background: "white",
          borderRadius: 999,
          padding: "5px 10px",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--accent, #6366f1)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Choose Cycle
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            top: 64,
            right: 12,
            width: "min(270px, calc(100vw - 24px))",
            zIndex: 80,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            padding: 10,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {!info ? (
            <div style={{ fontSize: 13, color: "#6b7280", padding: 6 }}>Loading…</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#6b7280", padding: "2px 6px" }}>Current cycle</div>
              <div style={{ fontSize: 15, fontWeight: 700, padding: "0 6px 8px" }}>{info.activeLabel}</div>

              <button
                type="button"
                onClick={start}
                disabled={!info.canStartNext || isPending}
                style={{
                  ...menuBtn,
                  background: info.canStartNext ? "var(--accent, #6366f1)" : "#e5e7eb",
                  color: info.canStartNext ? "white" : "#9ca3af",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Start {info.nextLabel} cycle now
              </button>
              <div style={{ fontSize: 11, color: "#9ca3af", padding: "4px 6px 8px" }}>
                The next cycle also starts on its own on the 1st.
              </div>

              {info.startedEarly && (
                <button type="button" onClick={undo} disabled={isPending} style={{ ...menuBtn, color: "#dc2626" }}>
                  Undo early start (back to {info.backLabel})
                </button>
              )}

              <div style={{ borderTop: "1px solid #f1f2f6", margin: "6px 0" }} />
              <div style={{ fontSize: 12, color: "#6b7280", padding: "2px 6px" }}>View a cycle</div>
              <button type="button" onClick={() => view("/dashboard")} style={{ ...menuBtn, fontWeight: 600 }}>
                {info.activeLabel} (current)
              </button>
              {info.past.length === 0 ? (
                <div style={{ fontSize: 12, color: "#9ca3af", padding: "4px 6px" }}>No past cycles yet.</div>
              ) : (
                info.past.map((p) => (
                  <button key={p.key} type="button" onClick={() => view(`/dashboard?cycle=${p.key}`)} style={menuBtn}>
                    {p.label}
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}