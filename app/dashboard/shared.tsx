"use client";

import { useState } from "react";
import type { SurveyRecord, AlertRecord } from "@/app/lib/types";

// ─── Style constants ────────────────────────────────────────────

export const HEADING_STYLE = {
  color: "var(--text)",
  fontFamily: "var(--font-mono)",
};

// ─── Time frame types & helpers ─────────────────────────────────

export type TimeFrame =
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

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function getDateRange(timeFrame: TimeFrame): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (timeFrame) {
    case "this_month": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    case "last_month": {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    case "last_quarter": {
      const start = new Date(y, m - 3, 1);
      const end = new Date(y, m, 0);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    case "last_year": {
      const start = new Date(y - 1, 0, 1);
      const end = new Date(y - 1, 11, 31);
      return { start: toDateStr(start), end: toDateStr(end) };
    }
    default:
      return { start: "", end: "" };
  }
}

export function filterByDateRange(
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

// ─── Name & score helpers ───────────────────────────────────────

export function formatClientName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getNpsColor(score: number): string {
  if (score >= 9) return "var(--success)";
  if (score >= 7) return "var(--warning)";
  return "var(--error)";
}

export function getCsatColor(score: number): string {
  if (score >= 4) return "var(--success)";
  if (score === 3) return "var(--warning)";
  return "var(--error)";
}

export function getNpsCategory(score: number): string {
  if (score >= 9) return "Promoter";
  if (score >= 7) return "Passive";
  return "Detractor";
}

export function getCsatCategory(score: number): string {
  if (score >= 4) return "Satisfied";
  if (score === 3) return "Neutral";
  return "Dissatisfied";
}

export function formatDate(dateStr: string): string {
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

export function getScore(r: SurveyRecord): number {
  if (r.surveyType === "NPS" && r.npsScore !== null) return r.npsScore;
  if (r.surveyType === "CSAT" && r.csatScore !== null) return r.csatScore;
  return 0;
}

export function getCategory(r: SurveyRecord): string {
  if (r.surveyType === "NPS" && r.npsScore !== null)
    return r.npsType || getNpsCategory(r.npsScore);
  if (r.surveyType === "CSAT" && r.csatScore !== null)
    return r.csatType || getCsatCategory(r.csatScore);
  return "—";
}

// ─── Time Frame Picker ──────────────────────────────────────────

export function TimeFramePicker({
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

// ─── Summary Card ────────────────────────────────────────────────

export interface SummaryCardData {
  label: string;
  value: number | string;
  suffix?: string;
  color: string;
}

export function SummaryCards({ cards }: { cards: SummaryCardData[] }) {
  const colClass =
    cards.length <= 3
      ? "grid-cols-2 sm:grid-cols-3"
      : cards.length === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";

  return (
    <div className={`mb-8 grid gap-4 ${colClass}`}>
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

// ─── Sortable Responses Table ───────────────────────────────────

type SortField =
  | "clientName"
  | "surveyType"
  | "score"
  | "category"
  | "milestone"
  | "submissionDate";
type SortDirection = "asc" | "desc";

export function ResponsesTable({
  records,
  onDelete,
  title = "Recent Responses",
  onClientClick,
}: {
  records: SurveyRecord[];
  onDelete: (record: SurveyRecord) => Promise<void>;
  title?: string;
  onClientClick?: (clientName: string) => void;
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
        {title}
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
          <thead style={{ borderBottom: "1px solid var(--border)" }}>
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
                    {onClientClick ? (
                      <button
                        onClick={() => onClientClick(r.clientName)}
                        className="cursor-pointer transition-colors hover:underline"
                        style={{ color: "var(--accent)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--text)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--accent)")
                        }
                      >
                        {formatClientName(r.clientName)}
                      </button>
                    ) : (
                      formatClientName(r.clientName)
                    )}
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

export function AlertsSection({
  alerts,
  title = "Detractor & Dissatisfied Alerts",
  emptyMessage = "All clear! No detractors or dissatisfied clients in the last 30 days.",
}: {
  alerts: AlertRecord[];
  title?: string;
  emptyMessage?: string;
}) {
  return (
    <div>
      <h2
        className="mb-4 text-[15px] font-bold"
        style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}
      >
        {title}
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
            {emptyMessage}
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

// ─── Loading & Error states ─────────────────────────────────────

export function LoadingState() {
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

export function ErrorState({ error }: { error: string }) {
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

// ─── Data fetching hook ─────────────────────────────────────────

import { useEffect } from "react";
import type { DashboardData, ClientRecord } from "@/app/lib/types";

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/dashboard/responses`
        );
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

  async function handleDeleteRecord(record: SurveyRecord) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/dashboard/responses?id=${record.id}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recentResponses: prev.recentResponses.filter((r) => r.id !== record.id),
        alerts: prev.alerts.filter((a) => a.id !== record.id),
      };
    });
  }

  async function handleCreateClient(client: {
    clientSlug: string;
    displayName: string;
    accountManager: string;
  }): Promise<ClientRecord> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/dashboard/clients`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to create client");
    }

    const newClient: ClientRecord = await response.json();

    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, clients: [...prev.clients, newClient] };
    });

    return newClient;
  }

  async function handleUpdateClient(
    id: string,
    fields: { displayName?: string; accountManager?: string }
  ) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/dashboard/clients`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      }
    );

    if (!response.ok) throw new Error("Update failed");

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === id ? { ...c, ...fields } : c
        ),
      };
    });
  }

  return {
    data,
    error,
    isLoading,
    handleDeleteRecord,
    handleCreateClient,
    handleUpdateClient,
  };
}
