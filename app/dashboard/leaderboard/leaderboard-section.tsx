"use client";

import type { RankedAMEntry, LeaderboardMetric } from "./compute-leaderboards";
import { AMRow } from "./am-row";
import { HEADING_STYLE } from "../shared";

const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  nps: "NPS",
  csat: "CSAT",
  volume: "Responses",
  alerts: "Alerts",
};

export function LeaderboardSection({
  title,
  entries,
  metric,
}: {
  title: string;
  entries: RankedAMEntry[];
  metric: LeaderboardMetric;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h3 className="text-[13px] font-bold" style={HEADING_STYLE}>
          {title}
        </h3>
      </div>

      {/* Column labels */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-8 flex-shrink-0 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          #
        </div>
        <div
          className="min-w-0 flex-1 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Account Manager
        </div>
        <div
          className="w-16 flex-shrink-0 text-right text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          {METRIC_LABELS[metric]}
        </div>
        <div
          className="hidden w-20 flex-shrink-0 text-right text-[10px] font-medium uppercase tracking-wider sm:block"
          style={{ color: "var(--text-muted)" }}
        >
          Details
        </div>
        <div
          className="hidden w-[100px] flex-shrink-0 text-right text-[10px] font-medium uppercase tracking-wider sm:block"
          style={{ color: "var(--text-muted)" }}
        >
          Trend
        </div>
      </div>

      {/* Rows */}
      {entries.length === 0 ? (
        <div
          className="flex items-center justify-center py-8"
          style={{ color: "var(--text-muted)" }}
        >
          <p className="text-[13px]">No account manager data available</p>
        </div>
      ) : (
        entries.map((entry) => (
          <AMRow key={entry.accountManager} entry={entry} metric={metric} />
        ))
      )}
    </div>
  );
}
