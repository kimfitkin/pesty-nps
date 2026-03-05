"use client";

import { useState } from "react";
import type { RankedAMEntry, LeaderboardMetric } from "./compute-leaderboards";
import { RankBadge } from "./rank-badge";
import { Sparkline } from "./sparkline";

const METRIC_COLORS: Record<LeaderboardMetric, string> = {
  nps: "var(--accent)",
  csat: "var(--success)",
  volume: "var(--text-bright)",
  alerts: "var(--error)",
};

function getPrimaryValue(
  entry: RankedAMEntry,
  metric: LeaderboardMetric
): { display: string; color: string } {
  switch (metric) {
    case "nps": {
      if (entry.avgNps === null) return { display: "—", color: "var(--text-muted)" };
      const color =
        entry.avgNps >= 50
          ? "var(--success)"
          : entry.avgNps >= 0
          ? "var(--warning)"
          : "var(--error)";
      return { display: String(entry.avgNps), color };
    }
    case "csat": {
      if (entry.avgCsat === null) return { display: "—", color: "var(--text-muted)" };
      const color =
        entry.avgCsat >= 4
          ? "var(--success)"
          : entry.avgCsat >= 3
          ? "var(--warning)"
          : "var(--error)";
      return { display: `${entry.avgCsat} / 5`, color };
    }
    case "volume":
      return { display: String(entry.totalResponses), color: "var(--text)" };
    case "alerts": {
      const color =
        entry.alertCount === 0
          ? "var(--success)"
          : entry.alertCount <= 2
          ? "var(--warning)"
          : "var(--error)";
      return { display: String(entry.alertCount), color };
    }
  }
}

function getTrendData(
  entry: RankedAMEntry,
  metric: LeaderboardMetric
): { month: string; value: number }[] {
  switch (metric) {
    case "nps":
      return entry.npsTrend;
    case "csat":
      return entry.csatTrend;
    case "volume":
      return entry.volumeTrend;
    case "alerts":
      return entry.alertTrend;
  }
}

export function AMRow({
  entry,
  metric,
}: {
  entry: RankedAMEntry;
  metric: LeaderboardMetric;
}) {
  const [hovered, setHovered] = useState(false);
  const primary = getPrimaryValue(entry, metric);
  const trend = getTrendData(entry, metric);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: hovered ? "var(--surface)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank */}
      <div className="flex-shrink-0">
        <RankBadge rank={entry.rank} />
      </div>

      {/* AM Name */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[13px] font-semibold"
          style={{ color: "var(--text)" }}
        >
          {entry.accountManager}
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {entry.clientCount} client{entry.clientCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Primary Metric */}
      <div
        className="w-16 flex-shrink-0 text-right text-[14px] font-bold"
        style={{ color: primary.color, fontFamily: "var(--font-mono)" }}
      >
        {primary.display}
      </div>

      {/* Secondary stats */}
      <div className="hidden w-20 flex-shrink-0 text-right sm:block">
        <p
          className="text-[11px]"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {entry.totalResponses} resp
        </p>
        <p
          className="text-[11px]"
          style={{
            color:
              entry.alertCount === 0
                ? "var(--text-muted)"
                : "var(--error)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {entry.alertCount} alert{entry.alertCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Sparkline */}
      <div className="hidden flex-shrink-0 sm:block">
        <Sparkline data={trend} color={METRIC_COLORS[metric]} />
      </div>
    </div>
  );
}
