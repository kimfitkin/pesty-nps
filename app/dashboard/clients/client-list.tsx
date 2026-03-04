"use client";

import { useState, useMemo } from "react";
import type { SurveyRecord } from "@/app/lib/types";
import { formatClientName, formatDate, HEADING_STYLE } from "../shared";

interface ClientSummary {
  clientName: string;
  displayName: string;
  totalSurveys: number;
  npsCount: number;
  csatCount: number;
  npsScore: number | null;
  avgCsat: number | null;
  lastActivityDate: string;
}

function computeClientSummaries(records: SurveyRecord[]): ClientSummary[] {
  const grouped = new Map<string, SurveyRecord[]>();
  for (const r of records) {
    const existing = grouped.get(r.clientName) || [];
    existing.push(r);
    grouped.set(r.clientName, existing);
  }

  const summaries: ClientSummary[] = [];
  for (const [clientName, clientRecords] of grouped) {
    const npsRecords = clientRecords.filter(
      (r) => r.surveyType === "NPS" && r.npsScore !== null
    );
    const csatRecords = clientRecords.filter(
      (r) => r.surveyType === "CSAT" && r.csatScore !== null
    );

    const sortedByDate = [...clientRecords].sort((a, b) =>
      b.submissionDate.localeCompare(a.submissionDate)
    );

    let npsScore: number | null = null;
    if (npsRecords.length > 0) {
      const promoters = npsRecords.filter((r) => r.npsScore! >= 9).length;
      const detractors = npsRecords.filter((r) => r.npsScore! <= 6).length;
      npsScore = Math.round(
        ((promoters - detractors) / npsRecords.length) * 100
      );
    }

    let avgCsat: number | null = null;
    if (csatRecords.length > 0) {
      const sum = csatRecords.reduce((s, r) => s + r.csatScore!, 0);
      avgCsat = parseFloat((sum / csatRecords.length).toFixed(1));
    }

    summaries.push({
      clientName,
      displayName: formatClientName(clientName),
      totalSurveys: clientRecords.length,
      npsCount: npsRecords.length,
      csatCount: csatRecords.length,
      npsScore,
      avgCsat,
      lastActivityDate: sortedByDate[0]?.submissionDate || "",
    });
  }

  return summaries.sort((a, b) =>
    b.lastActivityDate.localeCompare(a.lastActivityDate)
  );
}

function getNpsScoreColor(score: number): string {
  if (score >= 50) return "var(--success)";
  if (score >= 0) return "var(--warning)";
  return "var(--error)";
}

function getCsatScoreColor(score: number): string {
  if (score >= 4) return "var(--success)";
  if (score >= 3) return "var(--warning)";
  return "var(--error)";
}

export function ClientList({
  records,
  onSelectClient,
}: {
  records: SurveyRecord[];
  onSelectClient: (clientName: string) => void;
}) {
  const [search, setSearch] = useState("");

  const summaries = useMemo(() => computeClientSummaries(records), [records]);

  const filtered = useMemo(() => {
    if (!search.trim()) return summaries;
    const q = search.toLowerCase();
    return summaries.filter((s) => s.displayName.toLowerCase().includes(q));
  }, [summaries, search]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold" style={HEADING_STYLE}>
          Clients
        </h2>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md px-3 py-1.5 text-[13px] focus:outline-none"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            minWidth: "200px",
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: "var(--card)",
            border: "1px dashed var(--border)",
          }}
        >
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {search ? "No clients match your search" : "No survey responses yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <button
              key={client.clientName}
              onClick={() => onSelectClient(client.clientName)}
              className="cursor-pointer rounded-lg p-5 text-left transition-colors"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--surface)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--card)")
              }
            >
              <div className="mb-3 flex items-center justify-between">
                <h3
                  className="text-[14px] font-bold"
                  style={{ color: "var(--text)" }}
                >
                  {client.displayName}
                </h3>
                <svg
                  className="h-4 w-4"
                  style={{ color: "var(--text-muted)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>

              <div className="mb-3 flex gap-4">
                {client.npsScore !== null && (
                  <div>
                    <p
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      NPS
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: getNpsScoreColor(client.npsScore),
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {client.npsScore}
                    </p>
                  </div>
                )}
                {client.avgCsat !== null && (
                  <div>
                    <p
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      CSAT
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        color: getCsatScoreColor(client.avgCsat),
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {client.avgCsat}
                      <span
                        className="text-xs font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        /5
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-between text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                <span>
                  {client.totalSurveys} survey{client.totalSurveys !== 1 ? "s" : ""}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatDate(client.lastActivityDate)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
