"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { SurveyRecord } from "@/app/lib/types";
import { HEADING_STYLE } from "../shared";

interface QuarterData {
  quarter: string;
  npsScore: number;
  responseCount: number;
}

function computeQuarterlyNps(npsRecords: SurveyRecord[]): QuarterData[] {
  const quarterMap = new Map<string, SurveyRecord[]>();

  for (const r of npsRecords) {
    if (!r.submissionDate || r.npsScore === null) continue;
    const date = new Date(r.submissionDate + "T00:00:00");
    const year = date.getFullYear();
    const month = date.getMonth();
    const q = Math.floor(month / 3) + 1;
    const key = `Q${q} ${year}`;

    const existing = quarterMap.get(key) || [];
    existing.push(r);
    quarterMap.set(key, existing);
  }

  const result: QuarterData[] = [];
  for (const [quarter, qRecords] of quarterMap) {
    const total = qRecords.length;
    const promoters = qRecords.filter((r) => r.npsScore! >= 9).length;
    const detractors = qRecords.filter((r) => r.npsScore! <= 6).length;
    const npsScore = Math.round(((promoters - detractors) / total) * 100);
    result.push({ quarter, npsScore, responseCount: total });
  }

  result.sort((a, b) => {
    const parse = (q: string) => {
      const [qPart, yearPart] = q.split(" ");
      return parseInt(yearPart) * 4 + parseInt(qPart.slice(1));
    };
    return parse(a.quarter) - parse(b.quarter);
  });

  return result;
}

export function NpsTrendChart({ records }: { records: SurveyRecord[] }) {
  const npsRecords = records.filter(
    (r) => r.surveyType === "NPS" && r.npsScore !== null
  );
  const data = computeQuarterlyNps(npsRecords);

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3 className="mb-4 text-[13px] font-bold" style={HEADING_STYLE}>
        NPS Trend (Quarter over Quarter)
      </h3>

      {data.length === 0 ? (
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            border: "1px dashed var(--border)",
            minHeight: "200px",
          }}
        >
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            No NPS data yet for this client
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="quarter"
                stroke="var(--text-muted)"
                fontSize={11}
                fontFamily="var(--font-mono)"
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                fontFamily="var(--font-mono)"
                domain={[-100, 100]}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--text-muted)" }}
                formatter={(value: number | undefined) => [`${value ?? 0}`, "NPS Score"]}
              />
              <ReferenceLine
                y={0}
                stroke="var(--text-muted)"
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="npsScore"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{
                  fill: "var(--accent)",
                  strokeWidth: 0,
                  r: 5,
                }}
                activeDot={{
                  fill: "var(--accent)",
                  strokeWidth: 2,
                  stroke: "var(--card)",
                  r: 7,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          {data.length === 1 && (
            <p
              className="mt-2 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Only 1 quarter of data. Trends will appear as more data is
              collected.
            </p>
          )}
        </>
      )}
    </div>
  );
}
