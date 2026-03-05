"use client";

import { useMemo, useState } from "react";
import type { SurveyRecord, AlertRecord, ClientRecord } from "@/app/lib/types";
import {
  formatClientName,
  formatDate,
  SummaryCards,
  ResponsesTable,
  AlertsSection,
  HEADING_STYLE,
  type SummaryCardData,
} from "../shared";
import { NpsTrendChart } from "./nps-trend-chart";
import { CsatMilestoneChart } from "./csat-milestone-chart";

function getClientCards(records: SurveyRecord[]): SummaryCardData[] {
  const npsRecords = records.filter(
    (r) => r.surveyType === "NPS" && r.npsScore !== null
  );
  const csatRecords = records.filter(
    (r) => r.surveyType === "CSAT" && r.csatScore !== null
  );

  let npsScore: number | string = "—";
  let npsColor = "var(--text-muted)";
  if (npsRecords.length > 0) {
    const promoters = npsRecords.filter((r) => r.npsScore! >= 9).length;
    const detractors = npsRecords.filter((r) => r.npsScore! <= 6).length;
    const score = Math.round(
      ((promoters - detractors) / npsRecords.length) * 100
    );
    npsScore = score;
    npsColor =
      score >= 50
        ? "var(--success)"
        : score >= 0
        ? "var(--warning)"
        : "var(--error)";
  }

  let avgCsat: number | string = "—";
  let csatColor = "var(--text-muted)";
  if (csatRecords.length > 0) {
    const sum = csatRecords.reduce((s, r) => s + r.csatScore!, 0);
    const avg = parseFloat((sum / csatRecords.length).toFixed(1));
    avgCsat = avg;
    csatColor =
      avg >= 4
        ? "var(--success)"
        : avg >= 3
        ? "var(--warning)"
        : "var(--error)";
  }

  const sortedByDate = [...records].sort((a, b) =>
    b.submissionDate.localeCompare(a.submissionDate)
  );
  const lastActivity = sortedByDate[0]
    ? formatDate(sortedByDate[0].submissionDate)
    : "—";

  return [
    {
      label: "NPS Score",
      value: npsScore,
      color: npsColor,
    },
    {
      label: "Avg CSAT",
      value: avgCsat,
      suffix: typeof avgCsat === "number" ? " / 5" : undefined,
      color: csatColor,
    },
    {
      label: "Total Surveys",
      value: records.length,
      color: "var(--text)",
    },
    {
      label: "Last Activity",
      value: lastActivity,
      color: "var(--text)",
    },
  ];
}

// ─── Survey Links ────────────────────────────────────────────────

const CSAT_MILESTONES = [
  { slug: "onboarding", label: "Onboarding" },
  { slug: "website-launch", label: "Website Launch" },
  { slug: "first-90-days", label: "First 90 Days" },
  { slug: "monthly-call", label: "Monthly Call" },
];

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 rounded px-2 py-1 text-[11px] font-medium cursor-pointer transition-colors"
      style={{
        backgroundColor: copied ? "var(--success-dim)" : "var(--surface)",
        border: `1px solid ${copied ? "var(--success)" : "var(--border)"}`,
        color: copied ? "var(--success)" : "var(--text-muted)",
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function SurveyLinks({ clientSlug }: { clientSlug: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${basePath}`
      : basePath;

  const npsUrl = `${baseUrl}/nps-${clientSlug}`;
  const csatUrls = CSAT_MILESTONES.map((m) => ({
    label: m.label,
    url: `${baseUrl}/csat-${m.slug}-${clientSlug}`,
  }));

  return (
    <div
      className="mb-8 rounded-lg p-5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        className="mb-4 text-[13px] font-bold"
        style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
      >
        Survey Links
      </h3>

      {/* NPS */}
      <div className="mb-3">
        <p
          className="mb-1.5 text-[11px] font-medium uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          NPS Survey
        </p>
        <div className="flex items-center gap-2">
          <code
            className="min-w-0 flex-1 truncate rounded px-2.5 py-1.5 text-[12px]"
            style={{
              backgroundColor: "var(--surface)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
          >
            {npsUrl}
          </code>
          <CopyButton url={npsUrl} />
        </div>
      </div>

      {/* CSAT milestones */}
      <p
        className="mb-1.5 text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        CSAT Surveys
      </p>
      <div className="space-y-2">
        {csatUrls.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-28 flex-shrink-0 text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              {item.label}
            </span>
            <code
              className="min-w-0 flex-1 truncate rounded px-2.5 py-1.5 text-[12px]"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--accent)",
                border: "1px solid var(--border)",
              }}
            >
              {item.url}
            </code>
            <CopyButton url={item.url} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientDetail({
  clientName,
  records,
  alerts,
  clients,
  onBack,
  onDelete,
  onUpdateClient,
}: {
  clientName: string;
  records: SurveyRecord[];
  alerts: AlertRecord[];
  clients: ClientRecord[];
  onBack: () => void;
  onDelete: (record: SurveyRecord) => Promise<void>;
  onUpdateClient: (
    id: string,
    fields: { displayName?: string; accountManager?: string }
  ) => Promise<void>;
}) {
  const clientRecords = useMemo(
    () => records.filter((r) => r.clientName === clientName),
    [records, clientName]
  );

  const clientAlerts = useMemo(
    () => alerts.filter((a) => a.clientName === clientName),
    [alerts, clientName]
  );

  const clientRecord = useMemo(
    () => clients.find((c) => c.clientSlug === clientName) || null,
    [clients, clientName]
  );

  const cards = useMemo(() => getClientCards(clientRecords), [clientRecords]);

  return (
    <>
      {/* Back button + header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <div>
          <h2 className="text-[15px] font-bold" style={HEADING_STYLE}>
            {clientRecord?.displayName || formatClientName(clientName)}
          </h2>
          {clientRecord?.accountManager && (
            <p
              className="text-[12px]"
              style={{ color: "var(--text-muted)" }}
            >
              Account Manager: {clientRecord.accountManager}
            </p>
          )}
        </div>
      </div>

      {/* Survey Links */}
      <SurveyLinks clientSlug={clientName} />

      {/* Summary cards */}
      <SummaryCards cards={cards} />

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NpsTrendChart records={clientRecords} />
        <CsatMilestoneChart records={clientRecords} />
      </div>

      {/* Responses table */}
      <ResponsesTable
        records={clientRecords}
        onDelete={onDelete}
        title="All Responses"
      />

      {/* Alerts */}
      <AlertsSection
        alerts={clientAlerts}
        title="Alerts"
        emptyMessage="No detractor or dissatisfied alerts for this client."
      />
    </>
  );
}
