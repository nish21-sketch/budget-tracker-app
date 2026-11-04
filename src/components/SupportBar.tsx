"use client";

import { useState } from "react";

const UPI_ID = "nishpish@ptyes";

export default function SupportBar() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
    <div style={{ margin: "0 0 12px" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: "linear-gradient(90deg,#fff7e6,#ffe7c2)",
          border: "1px solid #f8d7a0",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(217,119,6,0.15)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18 }}>☕</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#92400e" }}>
          Enjoying Track Kar? Buy a coffee for a good cause
        </span>
        <span style={{ color: "#b45309", fontSize: 12 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 6,
            padding: 14,
            background: "#fffbf2",
            border: "1px solid #f8d7a0",
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.5,
            color: "#78350f",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Thank you for being here 💛</div>
          <p style={{ margin: "0 0 8px" }}>
            Track Kar is free for everyone. If it has helped you stay on top of your money,
            you can share a coffee&apos;s worth of kindness. Whatever comes in goes to animal
            rescue and to people who need a helping hand.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            Even ₹50 goes a long way. And if you&apos;d rather not, no worries at all. Using
            the app and telling a friend is thanks enough.
          </p>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Pay to this UPI ID from any app (GPay, PhonePe, Paytm…)
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code
              style={{
                flex: 1,
                padding: "8px 10px",
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
                padding: "8px 14px",
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
      )}
    </div>
  );
}