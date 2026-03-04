import { NextRequest, NextResponse } from "next/server";

const VALID_MILESTONES = [
  "Onboarding",
  "Website Launch",
  "Monthly Call",
  "First 90 Days",
] as const;

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_SURVEYS_TABLE_ID) {
      console.error("Missing Airtable environment variables:", {
        hasToken: !!process.env.AIRTABLE_TOKEN,
        hasBaseId: !!process.env.AIRTABLE_BASE_ID,
        hasTableId: !!process.env.AIRTABLE_SURVEYS_TABLE_ID,
      });
      return NextResponse.json(
        { error: "Server configuration error: missing Airtable credentials" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      client = "unknown",
      surveyType,
      milestone,
      npsScore,
      csatScore,
      followUpScore,
      feedback = "",
    } = body;

    // Validate survey type
    if (surveyType !== "nps" && surveyType !== "csat") {
      return NextResponse.json(
        { error: "surveyType must be 'nps' or 'csat'" },
        { status: 400 }
      );
    }

    // Build Airtable fields based on survey type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: Record<string, any> = {
      "Client Name": client,
      "Survey Type": surveyType === "nps" ? "NPS" : "CSAT",
      "Open Feedback": feedback,
      "Submission Timestamp": new Date().toISOString().split("T")[0],
    };

    if (surveyType === "nps") {
      // Validate NPS score
      if (
        typeof npsScore !== "number" ||
        npsScore < 0 ||
        npsScore > 10 ||
        !Number.isInteger(npsScore)
      ) {
        return NextResponse.json(
          { error: "npsScore must be an integer 0-10" },
          { status: 400 }
        );
      }

      fields["NPS Score"] = npsScore;
    }

    if (surveyType === "csat") {
      // Validate milestone
      if (!milestone || !VALID_MILESTONES.includes(milestone)) {
        return NextResponse.json(
          {
            error:
              "milestone is required for CSAT and must be one of: Onboarding, Website Launch, Monthly Call, First 90 Days",
          },
          { status: 400 }
        );
      }

      // Validate CSAT score
      if (
        typeof csatScore !== "number" ||
        csatScore < 1 ||
        csatScore > 5 ||
        !Number.isInteger(csatScore)
      ) {
        return NextResponse.json(
          { error: "csatScore must be an integer 1-5" },
          { status: 400 }
        );
      }

      fields["Milestone"] = milestone;
      fields["CSAT Score"] = csatScore;

      // Optional follow-up score
      if (followUpScore !== undefined && followUpScore !== null) {
        if (
          typeof followUpScore !== "number" ||
          followUpScore < 1 ||
          followUpScore > 5 ||
          !Number.isInteger(followUpScore)
        ) {
          return NextResponse.json(
            { error: "followUpScore must be an integer 1-5" },
            { status: 400 }
          );
        }
        fields["Follow-Up Score"] = followUpScore;
      }
    }

    // Submit to Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_SURVEYS_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{ fields }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airtable error:", response.status, errorText);
      return NextResponse.json(
        { error: "Submission failed", details: errorText, airtableStatus: response.status },
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
