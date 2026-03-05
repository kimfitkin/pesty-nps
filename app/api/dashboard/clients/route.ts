import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/app/lib/constants";
import { verifySessionCookie } from "@/app/lib/auth";
import { createClientRecord, updateClientRecord } from "@/app/lib/airtable";

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value || !verifySessionCookie(cookie.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { clientSlug, displayName, accountManager } = await request.json();

    if (!clientSlug || !displayName || !accountManager) {
      return NextResponse.json(
        { error: "clientSlug, displayName, and accountManager are required" },
        { status: 400 }
      );
    }

    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(clientSlug)) {
      return NextResponse.json(
        {
          error:
            "Client slug must be lowercase letters, numbers, and hyphens only",
        },
        { status: 400 }
      );
    }

    const record = await createClientRecord({
      clientSlug,
      displayName,
      accountManager,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("Client create error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value || !verifySessionCookie(cookie.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, displayName, accountManager } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await updateClientRecord(id, { displayName, accountManager });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Client update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
