"use client";

import { useMemo } from "react";
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
