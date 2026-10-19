"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo" style={{ marginBottom: 20 }}>
          <span className="mark">₹</span> BudgetApp
        </div>

        {step === "email" && (
          <form onSubmit={sendCode}>
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
              autoFocus
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 14 }}>
              {loading ? "Sending code…" : "Send me a code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
              We sent a 6-digit code to <b>{email}</b>. Enter it below.
            </p>
            <label className="field-label" htmlFor="code">Code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="auth-input"
              style={{ textAlign: "center", fontSize: 22, letterSpacing: 6 }}
              autoFocus
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading || code.length < 6} style={{ width: "100%", marginTop: 14 }}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
              style={{ width: "100%", marginTop: 8, background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}