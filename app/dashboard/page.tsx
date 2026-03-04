"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DashboardSummary } from "@/app/lib/types";
import {
  HEADING_STYLE,
  TimeFramePicker,
  SummaryCards,
  ResponsesTable,
  AlertsSection,
  LoadingState,
  ErrorState,
  useDashboardData,
  getDateRange,
  filterByDateRange,
  type TimeFrame,
  type SummaryCardData,
} from "./shared";
import { OverviewNpsChart } from "./overview-nps-chart";
import { OverviewCsatChart } from "./overview-csat-chart";

// ─── Recompute summary from filtered records ────────────────────

function computeOverviewSummary(
  records: { surveyType: string; npsScore: number | null; csatScore: number | null }[]
): DashboardSummary {
  const npsRecords = records.filter(
    (r) => r.surveyType === "NPS" && r.npsScore !== null
  );
  const csatRecords = records.filter(
    (r) => r.surveyType === "CSAT" && r.csatScore !== null
  );

  let currentNps = 0;
  if (npsRecords.length > 0) {
    const promoters = npsRecords.filter((r) => r.npsScore! >= 9).length;
    const detractors = npsRecords.filter((r) => r.npsScore! <= 6).length;
    currentNps = Math.round(
      ((promoters - detractors) / npsRecords.length) * 100
    );
  }

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

function getOverviewCards(summary: DashboardSummary): SummaryCardData[] {
  return [
    {
      label: "Current NPS",
      value: summary.currentNps,
      color:
        summary.currentNps >= 50
          ? "var(--success)"
          : summary.currentNps >= 0
          ? "var(--warning)"
          : "var(--error)",
    },
    {
      label: "NPS Responses",
      value: summary.totalNpsResponses,
      color: "var(--text)",
    },
    {
      label: "Avg CSAT",
      value: summary.averageCsat,
      suffix: " / 5",
      color:
        summary.averageCsat >= 4
          ? "var(--success)"
          : summary.averageCsat >= 3
          ? "var(--warning)"
          : "var(--error)",
    },
    {
      label: "CSAT Responses",
      value: summary.totalCsatResponses,
      color: "var(--text)",
    },
    {
      label: "Total Responses",
      value: summary.totalResponses,
      color: "var(--text)",
    },
  ];
}

// ─── Main Dashboard Page ────────────────────────────────────────

export default function DashboardPage() {
  const { data, error, isLoading, handleDeleteRecord } = useDashboardData();
  const router = useRouter();

  const [timeFrame, setTimeFrame] = useState<TimeFrame>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleClientClick = useCallback(
    (clientName: string) => {
      router.push(`/dashboard/clients?client=${encodeURIComponent(clientName)}`);
    },
    [router]
  );

  const filteredData = useMemo(() => {
    if (!data) return null;

    const { start, end } =
      timeFrame === "custom"
        ? { start: customStart, end: customEnd }
        : getDateRange(timeFrame);

    const filteredRecords = filterByDateRange(data.recentResponses, start, end);

    const filteredAlerts = data.alerts.filter((a) => {
      if (!a.submissionDate) return false;
      if (start && a.submissionDate < start) return false;
      if (end && a.submissionDate > end) return false;
      return true;
    });

    return {
      summary: computeOverviewSummary(filteredRecords),
      recentResponses: filteredRecords,
      alerts: filteredAlerts,
    };
  }, [data, timeFrame, customStart, customEnd]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!filteredData) return null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold" style={HEADING_STYLE}>
          Overview
        </h2>
        <TimeFramePicker
          timeFrame={timeFrame}
          onTimeFrameChange={setTimeFrame}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      </div>

      <SummaryCards cards={getOverviewCards(filteredData.summary)} />

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OverviewNpsChart records={filteredData.recentResponses} />
        <OverviewCsatChart records={filteredData.recentResponses} />
      </div>

      <ResponsesTable
        records={filteredData.recentResponses}
        onDelete={handleDeleteRecord}
        onClientClick={handleClientClick}
      />
      <AlertsSection alerts={filteredData.alerts} />
    </>
  );
}
