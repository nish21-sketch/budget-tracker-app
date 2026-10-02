"use client";

import { useMemo, useState } from "react";
import { fmt } from "@/lib/utils";

type Row = { id: string; month: string; category: string; amount: number; note: string };

export default function HistoricTable({ rows, currency }: { rows: Row[]; currency: string }) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category))).sort(), [rows]);

  const filtered = categoryFilter ? rows.filter((r) => r.category === categoryFilter) : rows;

  function exportCsv() {
    const header = "Month,Category,Amount,Note\n";
    const body = filtered
      .map((r) => `${r.month},"${r.category}",${r.amount},"${r.note.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historic_spend.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Historic</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="budget-scroll">
        <table className="budget-table" style={{ textAlign: "left" }}>
          <thead>
            <tr><th>Month</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th><th>Note</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--muted)", textAlign: "center" }}>No logged expenses yet.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.month}</td>
                <td>{r.category}</td>
                <td style={{ textAlign: "right" }}>{fmt(r.amount, currency)}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
