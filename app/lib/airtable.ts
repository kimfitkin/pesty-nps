import {
  SurveyRecord,
  DashboardData,
  DashboardSummary,
  AlertRecord,
} from "./types";

// ─── Airtable fetching ──────────────────────────────────────────

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

/**
 * Fetch all survey records from Airtable (handles pagination).
 */
async function fetchAllRecords(): Promise<AirtableRecord[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_SURVEYS_TABLE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  if (!baseId || !tableId || !token) {
    throw new Error("Missing Airtable configuration");
  }

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${tableId}`
    );
    // Sort by Submission Timestamp descending
    url.searchParams.set("sort[0][field]", "Submission Timestamp");
    url.searchParams.set("sort[0][direction]", "desc");
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airtable fetch error:", response.status, errorText);
      throw new Error(`Airtable fetch failed: ${response.status}`);
    }

    const data: AirtableResponse = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

/**
 * Transform an Airtable record into our app's SurveyRecord type.
 */
function transformRecord(record: AirtableRecord): SurveyRecord {
  const f = record.fields;
  return {
    id: record.id,
    clientName: (f["Client Name"] as string) || "Unknown",
    surveyType: (f["Survey Type"] as "NPS" | "CSAT") || "NPS",
    milestone: (f["Milestone"] as string) || null,
    npsScore: typeof f["NPS Score"] === "number" ? f["NPS Score"] : null,
    csatScore: typeof f["CSAT Score"] === "number" ? f["CSAT Score"] : null,
    followUpScore:
      typeof f["Follow-Up Score"] === "number" ? f["Follow-Up Score"] : null,
    feedback: (f["Open Feedback"] as string) || "",
    npsType: (f["NPS Type (dedicated)"] as string) || null,
    csatType: (f["CSAT Type"] as string) || null,
    submissionDate: (f["Submission Timestamp"] as string) || "",
  };
}

// ─── Metric computation ─────────────────────────────────────────

function computeSummary(records: SurveyRecord[]): DashboardSummary {
  const npsRecords = records.filter(
    (r) => r.surveyType === "NPS" && r.npsScore !== null
  );
  const csatRecords = records.filter(
    (r) => r.surveyType === "CSAT" && r.csatScore !== null
  );

  // NPS = % promoters (9-10) - % detractors (0-6)
  let currentNps = 0;
  if (npsRecords.length > 0) {
    const promoters = npsRecords.filter((r) => r.npsScore! >= 9).length;
    const detractors = npsRecords.filter((r) => r.npsScore! <= 6).length;
    currentNps = Math.round(
      ((promoters - detractors) / npsRecords.length) * 100
    );
  }

  // Average CSAT
  let averageCsat = 0;
  if (csatRecords.length > 0) {
    const total = csatRecords.reduce((sum, r) => sum + r.csatScore!, 0);
    averageCsat = parseFloat((total / csatRecords.length).toFixed(1));
  }

  return {
    currentNps,
    totalNpsResponses: npsRecords.length,
    averageCsat,
    totalCsatResponses: csatRecords.length,
    totalResponses: records.length,
  };
}

function computeAlerts(records: SurveyRecord[]): AlertRecord[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

  return records
    .filter((r) => {
      if (!r.submissionDate || r.submissionDate < cutoff) return false;

      // NPS detractors: 0-6
      if (r.surveyType === "NPS" && r.npsScore !== null && r.npsScore <= 6) {
        return true;
      }
      // CSAT dissatisfied: 1-2
      if (r.surveyType === "CSAT" && r.csatScore !== null && r.csatScore <= 2) {
        return true;
      }
      return false;
    })
    .map((r) => ({
      id: r.id,
      clientName: r.clientName,
      surveyType: r.surveyType,
      score:
        r.surveyType === "NPS" ? r.npsScore! : r.csatScore!,
      category:
        r.surveyType === "NPS"
          ? r.npsType || "Detractor"
          : r.csatType || "Dissatisfied",
      milestone: r.milestone,
      feedback: r.feedback,
      submissionDate: r.submissionDate,
    }));
}

// ─── Main export ────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const rawRecords = await fetchAllRecords();
  const records = rawRecords.map(transformRecord);

  const summary = computeSummary(records);
  const recentResponses = records; // Return all records; client-side filters by time frame
  const alerts = computeAlerts(records);

  return { summary, recentResponses, alerts };
}
