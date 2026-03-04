"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  getNpsCategory,
  type TimeFrame,
  type SummaryCardData,
} from "../shared";

function getNpsCards(
  records: { npsScore: number | null }[]
): SummaryCardData[] {
  const valid = records.filter((r) => r.npsScore !== null);
  const total = valid.length;

  const promoters = valid.filter((r) => r.npsScore! >= 9).length;
  const passives = valid.filter((r) => r.npsScore! >= 7 && r.npsScore! <= 8).length;
  const detractors = valid.filter((r) => r.npsScore! <= 6).length;

  const npsScore =
    total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;

  const pctPromoters = total > 0 ? Math.round((promoters / total) * 100) : 0;
  const pctPassives = total > 0 ? Math.round((passives / total) * 100) : 0;
  const pctDetractors = total > 0 ? Math.round((detractors / total) * 100) : 0;

  return [
    {
      label: "NPS Score",
      value: npsScore,
      color:
        npsScore >= 50
          ? "var(--success)"
          : npsScore >= 0
          ? "var(--warning)"
          : "var(--error)",
    },
    {
      label: "Responses",
      value: total,
      color: "var(--text)",
    },
    {
      label: "Promoters",
      value: `${pctPromoters}%`,
      color: "var(--success)",
    },
    {
      label: "Passives",
      value: `${pctPassives}%`,
      color: "var(--warning)",
    },
    {
      label: "Detractors",
      value: `${pctDetractors}%`,
      color: "var(--error)",
    },
  ];
}

export default function NpsDashboardPage() {
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

    // Filter to NPS only
    const npsRecords = data.recentResponses.filter(
      (r) => r.surveyType === "NPS"
    );
    const filteredRecords = filterByDateRange(npsRecords, start, end);

    // NPS alerts only (detractors)
    const filteredAlerts = data.alerts
      .filter((a) => a.surveyType === "NPS")
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
          NPS Responses
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

      <SummaryCards cards={getNpsCards(filteredData.records)} />
      <ResponsesTable
        records={filteredData.records}
        onDelete={handleDeleteRecord}
        title="NPS Responses"
        onClientClick={handleClientClick}
      />
      <AlertsSection
        alerts={filteredData.alerts}
        title="Detractor Alerts"
        emptyMessage="All clear! No detractors in this time period."
      />
    </>
  );
}
