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
    <div className="min-h-screen" style={{ backgroundColor: "#F1F7FB" }}>
      {/* Header */}
      <header
        className="shadow-sm"
        style={{ backgroundColor: "#002330" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <h1
            className="text-xl font-bold text-white sm:text-2xl"
            style={{ fontFamily: "var(--font-epilogue)" }}
          >
            Pesty Marketing{" "}
            <span className="font-normal opacity-70">—</span>{" "}
            <span className="font-normal opacity-90">
              Client Feedback Dashboard
            </span>
          </h1>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              className="border-b-2 px-1 py-3 text-sm font-semibold transition-colors"
              style={{
                borderColor: "#D90429",
                color: "#002330",
              }}
            >
              Overview
            </button>
            <span className="flex items-center gap-1 px-1 py-3 text-sm text-gray-400 cursor-not-allowed">
              NPS
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-400">
                Soon
              </span>
            </span>
            <span className="flex items-center gap-1 px-1 py-3 text-sm text-gray-400 cursor-not-allowed">
              CSAT
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-400">
                Soon
              </span>
            </span>
            <span className="flex items-center gap-1 px-1 py-3 text-sm text-gray-400 cursor-not-allowed">
              Clients
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-400">
                Soon
              </span>
            </span>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
