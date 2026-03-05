"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";

interface SparklineProps {
  data: { month: string; value: number }[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color,
  width = 100,
  height = 32,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[11px]"
        style={{ width, height, color: "var(--text-muted)", opacity: 0.4 }}
      >
        —
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
