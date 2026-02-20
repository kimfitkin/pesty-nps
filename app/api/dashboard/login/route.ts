import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSessionCookie,
  getCookieOptions,
} from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password)) {
      console.error("Login failed: password mismatch", {
        inputLength: password.length,
        envSet: !!process.env.DASHBOARD_PASSWORD,
        envLength: process.env.DASHBOARD_PASSWORD?.length,
      });
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const { value, expires } = createSessionCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      ...getCookieOptions(expires),
      value,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
