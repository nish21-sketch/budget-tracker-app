"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (!data.session) {
        setError("Account created, but no session was returned. Check Supabase: Authentication → Providers → Email → 'Confirm email' must be off.");
        return;
      }
      router.replace("/onboarding");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    }
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

        <form onSubmit={submit}>
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
              marginBottom: 12,
              boxSizing: "border-box",
            }}
            autoFocus
          />

          <label style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 6 }} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
              marginBottom: 14,
              boxSizing: "border-box",
            }}
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
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          style={{
            width: "100%",
            marginTop: 14,
            background: "none",
            border: "none",
            color: "var(--accent, #6366f1)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}