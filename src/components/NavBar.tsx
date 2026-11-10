"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMyProfile } from "@/lib/actions";
import CycleSwitcher from "./CycleSwitcher";
import ProfileMenu, { shownName } from "./ProfileMenu";
import type { MyProfile } from "./ProfileMenu";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log", label: "Log Expense" },
  { href: "/planned", label: "Future Estimate" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar({ monthLabel, initial }: { monthLabel: string; initial: string }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const first = shownName(profile).split(" ")[0];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="logo">
            <span className="mark">₹</span> Track Kar
          </div>
          {first && (
            <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginTop: 3 }}>
              Hi {first}!
            </div>
          )}
        </div>
        <div className="topbar-right">
          <CycleSwitcher fallbackLabel={monthLabel} />
          <ProfileMenu profile={profile} fallbackInitial={initial} onChange={setProfile} />
        </div>
      </div>

      <nav
        aria-label="Main"
        style={{
          display: "flex",
          alignItems: "stretch",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          margin: "0 0 12px",
          padding: "0 4px",
        }}
      >
        {links.map((l, i) => {
          const active = pathname === l.href;
          return (
            <Fragment key={l.href}>
              {i > 0 && (
                <span aria-hidden style={{ alignSelf: "center", color: "#d1d5db", fontWeight: 300 }}>
                  |
                </span>
              )}
              <Link
                href={l.href}
                style={{
                  flex: "1 1 auto",
                  textAlign: "center",
                  padding: "11px 6px",
                  fontSize: "clamp(11px, 3.2vw, 14px)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  color: active ? "var(--accent, #6366f1)" : "#374151",
                  borderBottom: active ? "2px solid var(--accent, #6366f1)" : "2px solid transparent",
                }}
              >
                {l.label}
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </>
  );
}