"use client";

import { useState, useMemo } from "react";
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
} from "../shared";

function getCsatCards(
  records: { csatScore: number | null; followUpScore: number | null }[]
): SummaryCardData[] {
  const valid = records.filter((r) => r.csatScore !== null);
  const total = valid.length;

  let avgCsat = 0;
  if (total > 0) {
    const sum = valid.reduce((s, r) => s + r.csatScore!, 0);
    avgCsat = parseFloat((sum / total).toFixed(1));
  }

  const satisfied = valid.filter((r) => r.csatScore! >= 4).length;
  const neutral = valid.filter((r) => r.csatScore! === 3).length;
  const dissatisfied = valid.filter((r) => r.csatScore! <= 2).length;

  const pctSatisfied = total > 0 ? Math.round((satisfied / total) * 100) : 0;
  const pctNeutral = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const pctDissatisfied = total > 0 ? Math.round((dissatisfied / total) * 100) : 0;

  // Follow-up score average
  const followUpRecords = records.filter((r) => r.followUpScore !== null);
  let avgFollowUp = 0;
  if (followUpRecords.length > 0) {
    const sum = followUpRecords.reduce((s, r) => s + r.followUpScore!, 0);
    avgFollowUp = parseFloat((sum / followUpRecords.length).toFixed(1));
  }

  return [
    {
      label: "Avg CSAT",
      value: avgCsat,
      suffix: " / 5",
      color:
        avgCsat >= 4
          ? "var(--success)"
          : avgCsat >= 3
          ? "var(--warning)"
          : "var(--error)",
    },
    {
      label: "Responses",
      value: total,
      color: "var(--text)",
    },
    {
      label: "Satisfied",
      value: `${pctSatisfied}%`,
      color: "var(--success)",
    },
    {
      label: "Neutral",
      value: `${pctNeutral}%`,
      color: "var(--warning)",
    },
    {
      label: "Dissatisfied",
      value: `${pctDissatisfied}%`,
      color: "var(--error)",
    },
  ];
}

export default function CsatDashboardPage() {
  const { data, error, isLoading, handleDeleteRecord } = useDashboardData();

  const [timeFrame, setTimeFrame] = useState<TimeFrame>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return null;

    const { start, end } =
      timeFrame === "custom"
        ? { start: customStart, end: customEnd }
        : getDateRange(timeFrame);

    // Filter to CSAT only
    const csatRecords = data.recentResponses.filter(
      (r) => r.surveyType === "CSAT"
    );
    const filteredRecords = filterByDateRange(csatRecords, start, end);

    // CSAT alerts only (dissatisfied)
    const filteredAlerts = data.alerts
      .filter((a) => a.surveyType === "CSAT")
      .filter((a) => {
        if (!a.submissionDate) return false;
        if (start && a.submissionDate < start) return false;
        if (end && a.submissionDate > end) return false;
        return true;
      });

    return {
      records: filteredRecords,
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
          CSAT Responses
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

      <SummaryCards cards={getCsatCards(filteredData.records)} />
      <ResponsesTable
        records={filteredData.records}
        onDelete={handleDeleteRecord}
        title="CSAT Responses"
      />
      <AlertsSection
        alerts={filteredData.alerts}
        title="Dissatisfied Client Alerts"
        emptyMessage="All clear! No dissatisfied clients in this time period."
      />
    </>
  );
}
