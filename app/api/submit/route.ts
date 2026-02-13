import { NextRequest, NextResponse } from "next/server";

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

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                "Customer Name": client,
                "NPS Score": score,
                "Customer Comment/Feedback": feedback,
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Airtable error:", errorData);
      return NextResponse.json(
        { error: "Submission failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit to Airtable:", error);
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
