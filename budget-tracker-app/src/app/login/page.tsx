"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="centered-wrap">
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: "center", marginBottom: 8 }}>
          <span className="mark">₹</span> BudgetApp
        </div>
        <h1>Sign in</h1>
        <p>No password needed — we&apos;ll email you a one-click sign-in link.</p>

        {sent ? (
          <div className="msg msg-success">
            Check your inbox at <b>{email}</b> for the sign-in link.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="msg msg-error">{error}</div>}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
