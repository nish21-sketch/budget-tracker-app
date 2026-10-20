"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--accent, #6366f1)" }}>₹</span> BudgetApp
        </div>

        {!sent ? (
          <form onSubmit={sendLink}>
            <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                marginBottom: 14,
                boxSizing: "border-box",
              }}
              autoFocus
            />
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "var(--accent, #6366f1)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Sending…" : "Send me a login link"}
            </button>
          </form>
        ) : (
          <div style={{ fontSize: 14, color: "#374151" }}>
            ✅ Check <b>{email}</b> for a sign-in link. Click it to log in.
          </div>
        )}
      </div>
    </div>
  );
}