import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "./app/lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /dashboard routes (not login page or login API)
  if (pathname === "/dashboard/login") return NextResponse.next();
  if (pathname.startsWith("/api/dashboard/login")) return NextResponse.next();

  // Check for session cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    // No cookie → redirect to login
    const loginUrl = new URL("/dashboard/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Structural check: cookie must have `payload.signature` format
  const parts = cookie.value.split(".");
  if (parts.length !== 2) {
    const loginUrl = new URL("/dashboard/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Expiry check (Edge-safe, no crypto needed)
  const expiry = parseInt(parts[0], 10);
  if (isNaN(expiry) || Date.now() > expiry) {
    const loginUrl = new URL("/dashboard/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/responses/:path*"],
};
