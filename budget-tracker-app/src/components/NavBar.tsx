"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log", label: "Log Expense" },
  { href: "/planned", label: "Planned Budget" },
  { href: "/historic", label: "Historic" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar({ monthLabel, initial }: { monthLabel: string; initial: string }) {
  const pathname = usePathname();

  return (
    <div className="topbar">
      <div className="logo"><span className="mark">₹</span> BudgetApp</div>
      <div className="topbar-right">
        <div className="navtabs">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="month-pill">📅 {monthLabel}</div>
        <form action={signOut}>
          <button className="avatar" title="Sign out" type="submit" style={{ border: "none", cursor: "pointer" }}>
            {initial}
          </button>
        </form>
      </div>
    </div>
  );
}
