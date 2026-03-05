"use client";

export function RankBadge({ rank }: { rank: number }) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold";

  if (rank === 1) {
    return (
      <span
        className={base}
        style={{
          backgroundColor: "rgba(251, 191, 36, 0.15)",
          color: "#fbbf24",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          fontFamily: "var(--font-mono)",
        }}
      >
        1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span
        className={base}
        style={{
          backgroundColor: "rgba(139, 143, 163, 0.15)",
          color: "var(--text-muted)",
          border: "1px solid rgba(139, 143, 163, 0.3)",
          fontFamily: "var(--font-mono)",
        }}
      >
        2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span
        className={base}
        style={{
          backgroundColor: "rgba(205, 127, 50, 0.15)",
          color: "#cd7f32",
          border: "1px solid rgba(205, 127, 50, 0.3)",
          fontFamily: "var(--font-mono)",
        }}
      >
        3
      </span>
    );
  }

  return (
    <span
      className={base}
      style={{
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {rank}
    </span>
  );
}
