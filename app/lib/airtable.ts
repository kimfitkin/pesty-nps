import {
  SurveyRecord,
  ClientRecord,
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

// ─── Clients table ──────────────────────────────────────────────

/**
 * Fetch all client records from Airtable Clients table (handles pagination).
 * Returns [] gracefully if AIRTABLE_CLIENTS_TABLE_ID is not set.
 */
async function fetchAllClientRecords(): Promise<AirtableRecord[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_CLIENTS_TABLE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  if (!baseId || !tableId || !token) {
    return []; // Gracefully return empty if not configured
  }

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${tableId}`
    );
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Airtable clients fetch error:", response.status, errorText);
      return []; // Return empty on error rather than crashing
    }

    const data: AirtableResponse = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

function transformClientRecord(record: AirtableRecord): ClientRecord {
  const f = record.fields;
  return {
    id: record.id,
    clientSlug: (f["Client Slug"] as string) || "",
    displayName: (f["Display Name"] as string) || "",
    accountManager: (f["Account Manager"] as string) || "",
  };
}

export async function createClientRecord(fields: {
  clientSlug: string;
  displayName: string;
  accountManager: string;
}): Promise<ClientRecord> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_CLIENTS_TABLE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  if (!baseId || !tableId || !token) {
    throw new Error("Missing Airtable Clients table configuration");
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Client Slug": fields.clientSlug,
              "Display Name": fields.displayName,
              "Account Manager": fields.accountManager,
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create client: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return transformClientRecord(data.records[0]);
}

export async function updateClientRecord(
  recordId: string,
  fields: { displayName?: string; accountManager?: string }
): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_CLIENTS_TABLE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  if (!baseId || !tableId || !token) {
    throw new Error("Missing Airtable Clients table configuration");
  }

  const airtableFields: Record<string, string> = {};
  if (fields.displayName !== undefined)
    airtableFields["Display Name"] = fields.displayName;
  if (fields.accountManager !== undefined)
    airtableFields["Account Manager"] = fields.accountManager;

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: airtableFields }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update client: ${response.status}`);
  }
}

export async function deleteClientRecord(recordId: string): Promise<void> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_CLIENTS_TABLE_ID;
  const token = process.env.AIRTABLE_TOKEN;

  if (!baseId || !tableId || !token) {
    throw new Error("Missing Airtable Clients table configuration");
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Airtable client delete error:", response.status, errorText);
    throw new Error(`Failed to delete client: ${response.status}`);
  }
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
  const [rawRecords, rawClients] = await Promise.all([
    fetchAllRecords(),
    fetchAllClientRecords(),
  ]);

  const records = rawRecords.map(transformRecord);
  const clients = rawClients.map(transformClientRecord);

  const summary = computeSummary(records);
  const recentResponses = records; // Return all records; client-side filters by time frame
  const alerts = computeAlerts(records);

  return { summary, recentResponses, alerts, clients };
}
