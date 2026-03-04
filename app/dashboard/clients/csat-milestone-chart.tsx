"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SurveyRecord } from "@/app/lib/types";
import { HEADING_STYLE } from "../shared";

interface MilestoneCsatData {
  milestone: string;
  avgCsat: number;
  avgFollowUp: number | null;
  responseCount: number;
}

const MILESTONE_ORDER = [
  "Onboarding",
  "Website Launch",
  "First 90 Days",
  "Monthly Call",
];

function computeMilestoneCsat(
  csatRecords: SurveyRecord[]
): MilestoneCsatData[] {
  const milestoneMap = new Map<string, SurveyRecord[]>();

  for (const r of csatRecords) {
    const milestone = r.milestone || "No Milestone";
    const existing = milestoneMap.get(milestone) || [];
    existing.push(r);
    milestoneMap.set(milestone, existing);
  }

  const result: MilestoneCsatData[] = [];
  for (const [milestone, mRecords] of milestoneMap) {
    const csatValues = mRecords.filter((r) => r.csatScore !== null);
    const followUpValues = mRecords.filter((r) => r.followUpScore !== null);

    const avgCsat =
      csatValues.length > 0
        ? parseFloat(
            (
              csatValues.reduce((s, r) => s + r.csatScore!, 0) /
              csatValues.length
            ).toFixed(1)
          )
        : 0;

    const avgFollowUp =
      followUpValues.length > 0
        ? parseFloat(
            (
              followUpValues.reduce((s, r) => s + r.followUpScore!, 0) /
              followUpValues.length
            ).toFixed(1)
          )
        : null;

    result.push({
      milestone,
      avgCsat,
      avgFollowUp,
      responseCount: mRecords.length,
    });
  }

  result.sort((a, b) => {
    const aIdx = MILESTONE_ORDER.indexOf(a.milestone);
    const bIdx = MILESTONE_ORDER.indexOf(b.milestone);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.milestone.localeCompare(b.milestone);
  });

  return result;
}

export function CsatMilestoneChart({
  records,
}: {
  records: SurveyRecord[];
}) {
  const csatRecords = records.filter(
    (r) => r.surveyType === "CSAT" && r.csatScore !== null
  );
  const data = computeMilestoneCsat(csatRecords);
  const hasFollowUp = csatRecords.some((r) => r.followUpScore !== null);

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3 className="mb-4 text-[13px] font-bold" style={HEADING_STYLE}>
        CSAT by Milestone
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
            No CSAT data yet for this client
          </p>
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(200, data.length * 60 + 60)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              stroke="var(--text-muted)"
              fontSize={11}
              fontFamily="var(--font-mono)"
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="milestone"
              stroke="var(--text-muted)"
              fontSize={11}
              width={110}
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
              formatter={(value: number | undefined) => [`${value ?? 0} / 5`]}
            />
            <Legend
              wrapperStyle={{
                color: "var(--text-muted)",
                fontSize: "11px",
                paddingTop: "8px",
              }}
            />
            <Bar
              dataKey="avgCsat"
              name="Avg CSAT"
              fill="var(--success)"
              barSize={18}
              radius={[0, 4, 4, 0]}
            />
            {hasFollowUp && (
              <Bar
                dataKey="avgFollowUp"
                name="Avg Follow-Up"
                fill="var(--accent)"
                barSize={18}
                radius={[0, 4, 4, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
