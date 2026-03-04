import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/app/lib/constants";
import { DashboardNav } from "./nav";

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
      <DashboardNav />

      {/* Page content */}
      <main className="mx-auto max-w-[1400px] px-6 py-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}
