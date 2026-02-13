import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client = "unknown", score, feedback = "" } = body;

    if (
      typeof score !== "number" ||
      score < 0 ||
      score > 10 ||
      !Number.isInteger(score)
    ) {
      return NextResponse.json(
        { error: "Score must be an integer 0-10" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, client, score, feedback]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit to Google Sheets:", error);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
