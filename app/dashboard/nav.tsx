"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "NPS", href: "/dashboard/nps" },
  { label: "CSAT", href: "/dashboard/csat" },
  { label: "Clients", href: "/dashboard/clients" },
  { label: "Leaderboard", href: "/dashboard/leaderboard" },
];

export function DashboardNav() {
  const pathname = usePathname();

  // Strip basePath for comparison (usePathname includes it)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const cleanPath = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return cleanPath === "/dashboard" || cleanPath === "/dashboard/";
    }
    return cleanPath.startsWith(href);
  }

  return (
    <nav
      style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="px-3 py-2.5 text-[13px] font-semibold transition-colors rounded-t-md"
                style={
                  active
                    ? {
                        backgroundColor: "var(--accent-dim)",
                        color: "var(--accent)",
                        borderBottom: "2px solid var(--accent)",
                      }
                    : {
                        color: "var(--text-muted)",
                      }
                }
              >
                {tab.label}
              </Link>
            );
          })}

        </div>
      </div>
    </nav>
  );
}
