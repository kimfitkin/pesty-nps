"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SurveyRecord } from "@/app/lib/types";
import { HEADING_STYLE } from "./shared";

const MILESTONE_COLORS: Record<string, string> = {
  Onboarding: "var(--accent)",
  "Website Launch": "var(--success)",
  "First 90 Days": "var(--warning)",
  "Monthly Call": "#a78bfa",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface MonthlyMilestoneData {
  month: string;
  [milestone: string]: string | number | null;
}

function computeMonthlyMilestoneCsat(
  records: SurveyRecord[]
): { data: MonthlyMilestoneData[]; milestones: string[] } {
  const csatRecords = records.filter(
    (r) => r.surveyType === "CSAT" && r.csatScore !== null && r.milestone
  );

  if (csatRecords.length === 0) return { data: [], milestones: [] };

  // Collect all unique milestones
  const milestoneSet = new Set<string>();

  // Group by month + milestone
  const monthMilestoneMap = new Map<string, Map<string, number[]>>();

  for (const r of csatRecords) {
    if (!r.submissionDate) continue;
    const date = new Date(r.submissionDate + "T00:00:00");
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${MONTH_NAMES[month]} ${year}`;
    const sortKey = `${year}-${String(month).padStart(2, "0")}`;
    const milestone = r.milestone!;

    milestoneSet.add(milestone);

    if (!monthMilestoneMap.has(sortKey)) {
      monthMilestoneMap.set(sortKey, new Map());
    }
    const milestoneMap = monthMilestoneMap.get(sortKey)!;

    if (!milestoneMap.has(milestone)) {
      milestoneMap.set(milestone, []);
    }
    milestoneMap.get(milestone)!.push(r.csatScore!);

    // Store display name
    if (!milestoneMap.has("__month__")) {
      milestoneMap.set("__month__", []);
    }
    // Use a trick: store the monthKey in first position
    milestoneMap.get("__month__")![0] = monthKey as unknown as number;
  }

  // Sort months chronologically
  const sortedKeys = [...monthMilestoneMap.keys()].sort();
  const milestones = [...milestoneSet];

  const data: MonthlyMilestoneData[] = sortedKeys.map((sortKey) => {
    const milestoneMap = monthMilestoneMap.get(sortKey)!;
    const monthLabel = milestoneMap.get("__month__")![0] as unknown as string;

    const entry: MonthlyMilestoneData = { month: monthLabel };

    for (const milestone of milestones) {
      const scores = milestoneMap.get(milestone);
      if (scores && scores.length > 0) {
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
        entry[milestone] = parseFloat(avg.toFixed(1));
      } else {
        entry[milestone] = null;
      }
    }

    return entry;
  });

  return { data, milestones };
}

export function OverviewCsatChart({ records }: { records: SurveyRecord[] }) {
  const { data, milestones } = computeMonthlyMilestoneCsat(records);

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3 className="mb-4 text-[13px] font-bold" style={HEADING_STYLE}>
        CSAT by Milestone (Month over Month)
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
            No CSAT data yet
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                stroke="var(--text-muted)"
                fontSize={11}
                fontFamily="var(--font-mono)"
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={11}
                fontFamily="var(--font-mono)"
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
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
                formatter={(value: number | undefined) => [
                  `${value ?? 0} / 5`,
                ]}
              />
              <Legend
                wrapperStyle={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  paddingTop: "8px",
                }}
              />
              {milestones.map((milestone) => (
                <Line
                  key={milestone}
                  type="monotone"
                  dataKey={milestone}
                  name={milestone}
                  stroke={MILESTONE_COLORS[milestone] || "var(--text-muted)"}
                  strokeWidth={2}
                  dot={{
                    fill:
                      MILESTONE_COLORS[milestone] || "var(--text-muted)",
                    strokeWidth: 0,
                    r: 4,
                  }}
                  activeDot={{
                    fill:
                      MILESTONE_COLORS[milestone] || "var(--text-muted)",
                    strokeWidth: 2,
                    stroke: "var(--card)",
                    r: 6,
                  }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {data.length === 1 && (
            <p
              className="mt-2 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Only 1 month of data. Trends will appear as more data is
              collected.
            </p>
          )}
        </>
      )}
    </div>
  );
}
