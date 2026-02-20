"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  DashboardData,
  DashboardSummary,
  SurveyRecord,
  AlertRecord,
} from "@/app/lib/types";

// ─── Time frame helpers ─────────────────────────────────────────

type TimeFrame =
  | "this_month"
  | "last_month"
  | "last_quarter"
  | "last_year"
  | "custom";

const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  last_quarter: "Last Quarter",
  last_year: "Last Year",
  custom: "Custom Range",
};

function getDateRange(timeFrame: TimeFrame): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  switch (timeFrame) {
    case "this_month": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0); // last day of current month
      return {
        start: toDateStr(start),
        end: toDateStr(end),
      };
    }
    case "last_month": {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return {
        start: toDateStr(start),
        end: toDateStr(end),
      };
    }
    case "last_quarter": {
      // Previous 3 full calendar months
      const start = new Date(y, m - 3, 1);
      const end = new Date(y, m, 0);
      return {
        start: toDateStr(start),
        end: toDateStr(end),
      };
    }
    case "last_year": {
      const start = new Date(y - 1, 0, 1);
      const end = new Date(y - 1, 11, 31);
      return {
        start: toDateStr(start),
        end: toDateStr(end),
      };
    }
    default:
      return { start: "", end: "" };
  }
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function filterByDateRange(
  records: SurveyRecord[],
  start: string,
  end: string
): SurveyRecord[] {
  if (!start && !end) return records;
  return records.filter((r) => {
    if (!r.submissionDate) return false;
    if (start && r.submissionDate < start) return false;
    if (end && r.submissionDate > end) return false;
    return true;
  });
}

// ─── Time Frame Picker ──────────────────────────────────────────

function TimeFramePicker({
  timeFrame,
  onTimeFrameChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: {
  timeFrame: TimeFrame;
  onTimeFrameChange: (tf: TimeFrame) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={timeFrame}
        onChange={(e) => onTimeFrameChange(e.target.value as TimeFrame)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-gray-400 focus:outline-none cursor-pointer"
        style={{ color: "#002330" }}
      >
        {Object.entries(TIME_FRAME_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {timeFrame === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

// ─── Score display helpers ──────────────────────────────────────

function getNpsColor(score: number): string {
  if (score >= 9) return "#16a34a"; // green
  if (score >= 7) return "#ca8a04"; // yellow
  return "#dc2626"; // red
}

function getCsatColor(score: number): string {
  if (score >= 4) return "#16a34a";
  if (score === 3) return "#ca8a04";
  return "#dc2626";
}

function getNpsCategory(score: number): string {
  if (score >= 9) return "Promoter";
  if (score >= 7) return "Passive";
  return "Detractor";
}

function getCsatCategory(score: number): string {
  if (score >= 4) return "Satisfied";
  if (score === 3) return "Neutral";
  return "Dissatisfied";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Summary Cards ──────────────────────────────────────────────

function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    {
      label: "Current NPS",
      value: summary.currentNps,
      suffix: "",
      color:
        summary.currentNps >= 50
          ? "#16a34a"
          : summary.currentNps >= 0
          ? "#ca8a04"
          : "#dc2626",
    },
    {
      label: "NPS Responses",
      value: summary.totalNpsResponses,
      suffix: "",
      color: "#002330",
    },
    {
      label: "Avg CSAT",
      value: summary.averageCsat,
      suffix: " / 5",
      color:
        summary.averageCsat >= 4
          ? "#16a34a"
          : summary.averageCsat >= 3
          ? "#ca8a04"
          : "#dc2626",
    },
    {
      label: "CSAT Responses",
      value: summary.totalCsatResponses,
      suffix: "",
      color: "#002330",
    },
    {
      label: "Total Responses",
      value: summary.totalResponses,
      suffix: "",
      color: "#002330",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl bg-white p-5 shadow-sm"
        >
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
            {card.label}
          </p>
          <p
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: card.color, fontFamily: "var(--font-epilogue)" }}
          >
            {card.value}
            {card.suffix && (
              <span className="text-base font-normal text-gray-400">
                {card.suffix}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Sortable Responses Table ───────────────────────────────────

type SortField =
  | "clientName"
  | "surveyType"
  | "score"
  | "category"
  | "milestone"
  | "submissionDate";
type SortDirection = "asc" | "desc";

function getScore(r: SurveyRecord): number {
  if (r.surveyType === "NPS" && r.npsScore !== null) return r.npsScore;
  if (r.surveyType === "CSAT" && r.csatScore !== null) return r.csatScore;
  return 0;
}

function getCategory(r: SurveyRecord): string {
  if (r.surveyType === "NPS" && r.npsScore !== null)
    return r.npsType || getNpsCategory(r.npsScore);
  if (r.surveyType === "CSAT" && r.csatScore !== null)
    return r.csatType || getCsatCategory(r.csatScore);
  return "—";
}

function ResponsesTable({ records }: { records: SurveyRecord[] }) {
  const [sortField, setSortField] = useState<SortField>("submissionDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = [...records].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case "clientName":
        aVal = a.clientName.toLowerCase();
        bVal = b.clientName.toLowerCase();
        break;
      case "surveyType":
        aVal = a.surveyType;
        bVal = b.surveyType;
        break;
      case "score":
        aVal = getScore(a);
        bVal = getScore(b);
        break;
      case "category":
        aVal = getCategory(a);
        bVal = getCategory(b);
        break;
      case "milestone":
        aVal = a.milestone || "";
        bVal = b.milestone || "";
        break;
      case "submissionDate":
        aVal = a.submissionDate;
        bVal = b.submissionDate;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function SortHeader({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <th
        className="sort-header cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {sortField === field && (
            <span className="text-gray-400">
              {sortDir === "asc" ? "↑" : "↓"}
            </span>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="mb-8">
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
      >
        Recent Responses
      </h2>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[700px]">
          <thead className="border-b">
            <tr>
              <SortHeader field="clientName">Client</SortHeader>
              <SortHeader field="surveyType">Type</SortHeader>
              <SortHeader field="score">Score</SortHeader>
              <SortHeader field="category">Category</SortHeader>
              <SortHeader field="milestone">Milestone</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Feedback
              </th>
              <SortHeader field="submissionDate">Date</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((r) => {
              const score = getScore(r);
              const scoreColor =
                r.surveyType === "NPS"
                  ? getNpsColor(score)
                  : getCsatColor(score);
              const scoreLabel =
                r.surveyType === "NPS" ? `${score}/10` : `${score}/5`;
              const category = getCategory(r);
              const isExpanded = expandedId === r.id;
              const feedbackTruncated =
                r.feedback.length > 80 && !isExpanded
                  ? r.feedback.slice(0, 80) + "..."
                  : r.feedback;

              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">
                    {r.clientName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor:
                          r.surveyType === "NPS" ? "#eff6ff" : "#f0fdf4",
                        color:
                          r.surveyType === "NPS" ? "#1d4ed8" : "#15803d",
                      }}
                    >
                      {r.surveyType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-bold"
                      style={{ color: scoreColor }}
                    >
                      {scoreLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.milestone || "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm text-gray-600">
                    {r.feedback ? (
                      <span
                        className={
                          r.feedback.length > 80 ? "cursor-pointer" : ""
                        }
                        onClick={() =>
                          r.feedback.length > 80
                            ? setExpandedId(isExpanded ? null : r.id)
                            : null
                        }
                      >
                        {feedbackTruncated}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(r.submissionDate)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No responses in this time period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Alerts Section ─────────────────────────────────────────────

function AlertsSection({ alerts }: { alerts: AlertRecord[] }) {
  return (
    <div>
      <h2
        className="mb-4 text-lg font-bold"
        style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
      >
        Detractor &amp; Dissatisfied Alerts
        <span className="ml-2 text-sm font-normal text-gray-500">
          Last 30 days
        </span>
      </h2>

      {alerts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-700">
            All clear! No detractors or dissatisfied clients in the last 30
            days.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl bg-white p-5 shadow-sm"
              style={{ borderLeft: "4px solid #dc2626" }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span
                  className="text-sm font-bold"
                  style={{ color: "#002330" }}
                >
                  {alert.clientName}
                </span>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor:
                      alert.surveyType === "NPS" ? "#eff6ff" : "#f0fdf4",
                    color:
                      alert.surveyType === "NPS" ? "#1d4ed8" : "#15803d",
                  }}
                >
                  {alert.surveyType}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#dc2626" }}
                >
                  {alert.surveyType === "NPS"
                    ? `${alert.score}/10`
                    : `${alert.score}/5`}
                </span>
                <span className="text-xs text-gray-400">
                  {alert.category}
                </span>
                {alert.milestone && (
                  <span className="text-xs text-gray-400">
                    • {alert.milestone}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  • {formatDate(alert.submissionDate)}
                </span>
              </div>
              {alert.feedback ? (
                <p className="text-sm text-gray-600">{alert.feedback}</p>
              ) : (
                <p className="text-sm italic text-gray-400">
                  No feedback provided
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recompute summary from filtered records ────────────────────

function computeFilteredSummary(records: SurveyRecord[]): DashboardSummary {
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

// ─── Main Dashboard Page ────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Time frame state
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/responses");
        if (response.status === 401) {
          window.location.href = "/dashboard/login";
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Compute filtered data based on time frame
  const filteredData = useMemo(() => {
    if (!data) return null;

    const { start, end } =
      timeFrame === "custom"
        ? { start: customStart, end: customEnd }
        : getDateRange(timeFrame);

    const filteredRecords = filterByDateRange(
      data.recentResponses,
      start,
      end
    );

    // Also filter alerts by selected time frame (not just last 30 days)
    const filteredAlerts = data.alerts.filter((a) => {
      if (!a.submissionDate) return false;
      if (start && a.submissionDate < start) return false;
      if (end && a.submissionDate > end) return false;
      return true;
    });

    return {
      summary: computeFilteredSummary(filteredRecords),
      recentResponses: filteredRecords,
      alerts: filteredAlerts,
    };
  }, [data, timeFrame, customStart, customEnd]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="rounded-xl bg-red-50 px-8 py-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm font-medium text-red-700 underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!filteredData) return null;

  return (
    <>
      {/* Header row: title + time frame picker */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2
          className="text-lg font-bold"
          style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
        >
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

      <SummaryCards summary={filteredData.summary} />
      <ResponsesTable records={filteredData.recentResponses} />
      <AlertsSection alerts={filteredData.alerts} />
    </>
  );
}
