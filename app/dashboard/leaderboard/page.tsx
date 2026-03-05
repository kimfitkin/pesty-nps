"use client";

import { useState, useMemo } from "react";
import {
  HEADING_STYLE,
  TimeFramePicker,
  LoadingState,
  ErrorState,
  useDashboardData,
  getDateRange,
  filterByDateRange,
  type TimeFrame,
} from "../shared";
import {
  computeAMLeaderboards,
  rankByNps,
  rankByCsat,
  rankByVolume,
  rankByFewestAlerts,
} from "./compute-leaderboards";
import { LeaderboardSection } from "./leaderboard-section";

export default function LeaderboardPage() {
  const { data, error, isLoading } = useDashboardData();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const leaderboards = useMemo(() => {
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

    const entries = computeAMLeaderboards(
      filteredRecords,
      data.clients,
      filteredAlerts
    );

    return {
      nps: rankByNps(entries),
      csat: rankByCsat(entries),
      volume: rankByVolume(entries),
      alerts: rankByFewestAlerts(entries),
    };
  }, [data, timeFrame, customStart, customEnd]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!leaderboards) return null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold" style={HEADING_STYLE}>
          Leaderboard
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

      <div className="space-y-8">
        <LeaderboardSection
          title="NPS Leaders"
          entries={leaderboards.nps}
          metric="nps"
        />
        <LeaderboardSection
          title="CSAT Leaders"
          entries={leaderboards.csat}
          metric="csat"
        />
        <LeaderboardSection
          title="Most Responses"
          entries={leaderboards.volume}
          metric="volume"
        />
        <LeaderboardSection
          title="Fewest Alerts"
          entries={leaderboards.alerts}
          metric="alerts"
        />
      </div>
    </>
  );
}
