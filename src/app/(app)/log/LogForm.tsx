"use client";

import { useState, useTransition } from "react";
import { logTransaction } from "@/lib/actions";
import { fmt } from "@/lib/utils";
import type { Category } from "@/lib/data";

type CategoryWithSoFar = Category & { soFar: number };

export default function LogForm({ categories, currency }: { categories: CategoryWithSoFar[]; currency: string }) {
  const [cats, setCats] = useState(categories);
  const [recent, setRecent] = useState<{ name: string; amt: number; time: string }[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, cat: CategoryWithSoFar) {
    if (e.key !== "Enter") return;
    const amt = parseFloat(inputs[cat.id] ?? "");
    if (!amt || amt <= 0) return;

    setCats((prev) => prev.map((c) => (c.id === cat.id ? { ...c, soFar: c.soFar + amt } : c)));
    setRecent((prev) => [
      { name: cat.name, amt, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ...prev,
    ]);
    setInputs((prev) => ({ ...prev, [cat.id]: "" }));

    startTransition(async () => {
      await logTransaction(cat.id, amt);
    });
  }

  return (
    <div className="log-wrap">
      <div className="log-header">
        <h1>Log an expense</h1>
        <p>Type an amount, press Enter — it saves instantly and the box clears itself.</p>
      </div>

      <div className="log-list">
        {cats.length === 0 && (
          <div className="log-row"><span style={{ color: "var(--muted)" }}>No categories yet — add some in Settings.</span></div>
        )}
        {cats.map((c) => {
          const over = c.soFar > Number(c.ideal_plan_amount) && Number(c.ideal_plan_amount) > 0;
          return (
            <div className={`log-row ${over ? "over" : ""}`} key={c.id}>
              <div className="cat">
                {c.name}
                <span className="so-far">So far: {fmt(c.soFar, currency)}{over ? " — over plan" : ""}</span>
              </div>
              <div className="log-input-wrap">
                <span className="currency">{currency}</span>
                <input
                  className="log-input"
                  type="number"
                  placeholder="0"
                  value={inputs[c.id] ?? ""}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, c)}
                  disabled={isPending}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="recent-box">
        <h4>Logged just now</h4>
        {recent.length === 0 ? (
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Nothing logged yet this session.</div>
        ) : (
          recent.map((e, i) => (
            <div className="recent-item" key={i}>
              <span>{e.name} — {fmt(e.amt, currency)} <span style={{ color: "#9ca3af" }}>· {e.time}</span></span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
