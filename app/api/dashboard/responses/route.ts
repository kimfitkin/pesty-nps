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
    const message =
      error instanceof Error ? error.message : "Failed to fetch dashboard data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Verify session cookie (HMAC check)
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value || !verifySessionCookie(cookie.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("id");

  if (!recordId) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_SURVEYS_TABLE_ID}/${recordId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airtable delete error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to delete record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}
