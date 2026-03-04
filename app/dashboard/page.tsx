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
        className="rounded-md px-3 py-1.5 text-[13px] font-medium cursor-pointer focus:outline-none"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
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
            className="rounded-md px-3 py-1.5 text-[13px] focus:outline-none"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            to
          </span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="rounded-md px-3 py-1.5 text-[13px] focus:outline-none"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Name formatting ────────────────────────────────────────────

function formatClientName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Score display helpers ──────────────────────────────────────

function getNpsColor(score: number): string {
  if (score >= 9) return "var(--success)";
  if (score >= 7) return "var(--warning)";
  return "var(--error)";
}

function getCsatColor(score: number): string {
  if (score >= 4) return "var(--success)";
  if (score === 3) return "var(--warning)";
  return "var(--error)";
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
          ? "var(--success)"
          : summary.currentNps >= 0
          ? "var(--warning)"
          : "var(--error)",
    },
    {
      label: "NPS Responses",
      value: summary.totalNpsResponses,
      suffix: "",
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
      suffix: "",
      color: "var(--text)",
    },
    {
      label: "Total Responses",
      value: summary.totalResponses,
      suffix: "",
      color: "var(--text)",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg p-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="mb-1 text-[11px] font-medium uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {card.label}
          </p>
          <p
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: card.color, fontFamily: "var(--font-mono)" }}
          >
            {card.value}
            {card.suffix && (
              <span
                className="text-base font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                {card.suffix}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Delete Modal ────────────────────────────────────────

function ConfirmDeleteModal({
  record,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  record: SurveyRecord;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg p-6"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="mb-2 text-base font-bold"
          style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
        >
          Delete Response
        </h3>
        <p className="mb-6 text-[13px]" style={{ color: "var(--text-muted)" }}>
          Are you sure you want to delete the {record.surveyType} response from{" "}
          <span style={{ color: "var(--text)" }}>
            {formatClientName(record.clientName)}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-md px-4 py-2 text-[13px] font-medium cursor-pointer transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium text-white cursor-pointer transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--error)" }}
          >
            {isDeleting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
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

function ResponsesTable({
  records,
  onDelete,
}: {
  records: SurveyRecord[];
  onDelete: (record: SurveyRecord) => Promise<void>;
}) {
  const [sortField, setSortField] = useState<SortField>("submissionDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SurveyRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        className="sort-header cursor-pointer select-none px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {sortField === field && (
            <span style={{ color: "var(--accent)" }}>
              {sortDir === "asc" ? "↑" : "↓"}
            </span>
          )}
        </span>
      </th>
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch {
      alert("Failed to delete response. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mb-8">
      <h2
        className="mb-4 text-[15px] font-bold"
        style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
      >
        Recent Responses
      </h2>

      {deleteTarget && (
        <ConfirmDeleteModal
          record={deleteTarget}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div
        className="overflow-x-auto rounded-lg"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <table className="w-full min-w-[750px]">
          <thead
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <tr>
              <SortHeader field="clientName">Client</SortHeader>
              <SortHeader field="surveyType">Type</SortHeader>
              <SortHeader field="score">Score</SortHeader>
              <SortHeader field="category">Category</SortHeader>
              <SortHeader field="milestone">Milestone</SortHeader>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Feedback
              </th>
              <SortHeader field="submissionDate">Date</SortHeader>
              <th
                className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
              </th>
            </tr>
          </thead>
          <tbody>
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
                <tr
                  key={r.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--surface)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td
                    className="px-4 py-3 text-[13px] font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {formatClientName(r.clientName)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor:
                          r.surveyType === "NPS"
                            ? "var(--accent-dim)"
                            : "var(--success-dim)",
                        color:
                          r.surveyType === "NPS"
                            ? "var(--accent)"
                            : "var(--success)",
                      }}
                    >
                      {r.surveyType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[13px] font-bold"
                      style={{
                        color: scoreColor,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {scoreLabel}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-[13px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {category}
                  </td>
                  <td
                    className="px-4 py-3 text-[13px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {r.milestone || "—"}
                  </td>
                  <td
                    className="max-w-xs px-4 py-3 text-[13px]"
                    style={{ color: "var(--text-bright)" }}
                  >
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
                      <span style={{ color: "var(--border)" }}>—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-[13px] whitespace-nowrap"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatDate(r.submissionDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="rounded p-1.5 transition-colors cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      title="Delete response"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--error)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-muted)")
                      }
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-[13px]"
                  style={{ color: "var(--text-muted)" }}
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
        className="mb-4 text-[15px] font-bold"
        style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
      >
        Detractor &amp; Dissatisfied Alerts
        <span
          className="ml-2 text-[12px] font-normal"
          style={{ color: "var(--text-muted)" }}
        >
          Last 30 days
        </span>
      </h2>

      {alerts.length === 0 ? (
        <div
          className="rounded-lg p-6 text-center"
          style={{
            backgroundColor: "var(--success-dim)",
            border: "1px dashed var(--success)",
          }}
        >
          <div
            className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(52, 211, 153, 0.2)" }}
          >
            <svg
              className="h-5 w-5"
              style={{ color: "var(--success)" }}
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
          <p
            className="text-[13px] font-medium"
            style={{ color: "var(--success)" }}
          >
            All clear! No detractors or dissatisfied clients in the last 30
            days.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg p-4"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--error)",
              }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span
                  className="text-[13px] font-bold"
                  style={{ color: "var(--text)" }}
                >
                  {formatClientName(alert.clientName)}
                </span>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor:
                      alert.surveyType === "NPS"
                        ? "var(--accent-dim)"
                        : "var(--success-dim)",
                    color:
                      alert.surveyType === "NPS"
                        ? "var(--accent)"
                        : "var(--success)",
                  }}
                >
                  {alert.surveyType}
                </span>
                <span
                  className="text-[13px] font-bold"
                  style={{
                    color: "var(--error)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {alert.surveyType === "NPS"
                    ? `${alert.score}/10`
                    : `${alert.score}/5`}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {alert.category}
                </span>
                {alert.milestone && (
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    • {alert.milestone}
                  </span>
                )}
                <span
                  className="text-[12px]"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  • {formatDate(alert.submissionDate)}
                </span>
              </div>
              {alert.feedback ? (
                <p
                  className="text-[13px]"
                  style={{ color: "var(--text-bright)" }}
                >
                  {alert.feedback}
                </p>
              ) : (
                <p
                  className="text-[13px] italic"
                  style={{ color: "var(--text-muted)" }}
                >
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/dashboard/responses`);
        if (response.status === 401) {
          window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/dashboard/login`;
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

  // Delete a record from Airtable and update local state
  async function handleDeleteRecord(record: SurveyRecord) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/dashboard/responses?id=${record.id}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    // Remove from local state
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recentResponses: prev.recentResponses.filter((r) => r.id !== record.id),
        alerts: prev.alerts.filter((a) => a.id !== record.id),
      };
    });
  }

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
            className="mx-auto h-8 w-8 animate-spin"
            style={{ color: "var(--text-muted)" }}
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
          <p
            className="mt-3 text-[13px]"
            style={{ color: "var(--text-muted)" }}
          >
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="rounded-lg px-8 py-6 text-center"
          style={{
            backgroundColor: "var(--error-dim)",
            border: "1px solid var(--error)",
          }}
        >
          <p className="text-[13px]" style={{ color: "var(--error)" }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-[13px] font-medium underline cursor-pointer"
            style={{ color: "var(--error)" }}
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
          className="text-[15px] font-bold"
          style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
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
      <ResponsesTable records={filteredData.recentResponses} onDelete={handleDeleteRecord} />
      <AlertsSection alerts={filteredData.alerts} />
    </>
  );
}
