import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/app/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  const isAuthenticated = !!session?.value;

  // If not authenticated, render children only (bare login page)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated: render dashboard shell
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-6 py-3 sm:px-10">
          <h1
            className="text-[15px] font-bold"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}
          >
            Pesty Marketing{" "}
            <span style={{ color: "var(--text-muted)" }}>/</span>{" "}
            <span style={{ color: "var(--text-bright)" }}>
              Client Feedback
            </span>
          </h1>
        </div>
      </header>

      {/* Tab navigation */}
      <nav
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
          <div className="flex gap-1">
            <button
              className="px-3 py-2.5 text-[13px] font-semibold transition-colors rounded-t-md"
              style={{
                backgroundColor: "var(--accent-dim)",
                color: "var(--accent)",
                borderBottom: "2px solid var(--accent)",
              }}
            >
              Overview
            </button>
            {["NPS", "CSAT", "Clients"].map((tab) => (
              <span
                key={tab}
                className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] cursor-not-allowed"
                style={{ color: "var(--text-muted)" }}
              >
                {tab}
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                  style={{
                    backgroundColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  Soon
                </span>
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-[1400px] px-6 py-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}
