import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/app/lib/constants";
import { verifySessionCookie } from "@/app/lib/auth";
import { getDashboardData } from "@/app/lib/airtable";

export async function GET(request: NextRequest) {
  // Verify session cookie (HMAC check)
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value || !verifySessionCookie(cookie.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
