"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const UPI_ID = "nishpish@ptyes";

function SupportModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = UPI_ID;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(17,24,39,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fffbf2",
          border: "1px solid #f8d7a0",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "#78350f",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#b45309",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
          Thank you for being here 🍓
        </div>
        <p style={{ margin: "0 0 8px" }}>
          Track Kar is free for everyone. If it has helped you stay on top of your money, you
          can share a little kindness. Whatever comes in goes to animal rescue and to people
          who need a helping hand.
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Even ₹50 goes a long way. And if you&apos;d rather not, no worries at all. Using the
          app and telling a friend is thanks enough.
        </p>
        <div style={{ fontSize: 12, marginBottom: 6 }}>
          Pay to this UPI ID from any app (GPay, PhonePe, Paytm…)
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <code
            style={{
              flex: 1,
              padding: "9px 10px",
              background: "white",
              border: "1px dashed #f0b95c",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {UPI_ID}
          </code>
          <button
            type="button"
            onClick={copy}
            style={{
              padding: "9px 16px",
              background: copied ? "#16a34a" : "#d97706",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Compact one-liner for the profile menu
export function SupportLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "6px 10px",
          background: "linear-gradient(90deg,#fff7e6,#ffe7c2)",
          border: "1px solid #f8d7a0",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          color: "#92400e",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Support Track Kar for a good cause
      </button>
      {open && <SupportModal onClose={() => setOpen(false)} />}
    </>
  );
}

// Bottom-of-page bar
export default function SupportBar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ margin: "24px 0 96px" }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "linear-gradient(90deg,#fff7e6,#ffe7c2)",
            border: "1px solid #f8d7a0",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(217,119,6,0.15)",
            cursor: "pointer",
            textAlign: "center",
            fontSize: "clamp(11px, 3.4vw, 14px)",
            fontWeight: 700,
            color: "#92400e",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Enjoying Track Kar? Support it for a good cause
        </button>
      </div>
      {open && <SupportModal onClose={() => setOpen(false)} />}
    </>
  );
}