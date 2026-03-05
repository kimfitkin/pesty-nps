import type { SurveyRecord, AlertRecord, ClientRecord } from "@/app/lib/types";

export interface AMLeaderboardEntry {
  accountManager: string;
  clientCount: number;
  avgNps: number | null;
  npsResponseCount: number;
  avgCsat: number | null;
  csatResponseCount: number;
  totalResponses: number;
  alertCount: number;
  npsTrend: { month: string; value: number }[];
  csatTrend: { month: string; value: number }[];
  volumeTrend: { month: string; value: number }[];
  alertTrend: { month: string; value: number }[];
}

export interface RankedAMEntry extends AMLeaderboardEntry {
  rank: number;
}

export type LeaderboardMetric = "nps" | "csat" | "volume" | "alerts";

// ─── Helpers ────────────────────────────────────────────────────────

function getMonth(dateStr: string): string {
  // "2025-03-15" → "2025-03"
  return dateStr.slice(0, 7);
}

function computeNps(records: SurveyRecord[]): number | null {
  const nps = records.filter(
    (r) => r.surveyType === "NPS" && r.npsScore !== null
  );
  if (nps.length === 0) return null;
  const promoters = nps.filter((r) => r.npsScore! >= 9).length;
  const detractors = nps.filter((r) => r.npsScore! <= 6).length;
  return Math.round(((promoters - detractors) / nps.length) * 100);
}

function computeAvgCsat(records: SurveyRecord[]): number | null {
  const csat = records.filter(
    (r) => r.surveyType === "CSAT" && r.csatScore !== null
  );
  if (csat.length === 0) return null;
  const sum = csat.reduce((s, r) => s + r.csatScore!, 0);
  return parseFloat((sum / csat.length).toFixed(1));
}

function sortedMonthlyEntries(
  map: Map<string, number>
): { month: string; value: number }[] {
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

// ─── Main aggregation ───────────────────────────────────────────────

export function computeAMLeaderboards(
  records: SurveyRecord[],
  clients: ClientRecord[],
  alerts: AlertRecord[]
): AMLeaderboardEntry[] {
  // Build clientSlug → accountManager map
  const clientToAM = new Map<string, string>();
  for (const c of clients) {
    const am = c.accountManager?.trim() || "Unassigned";
    clientToAM.set(c.clientSlug, am);
  }

  // Group records by AM
  const amRecords = new Map<string, SurveyRecord[]>();
  const amClients = new Map<string, Set<string>>();
  const amAlerts = new Map<string, AlertRecord[]>();

  for (const r of records) {
    const am = clientToAM.get(r.clientName) || "Unassigned";
    if (!amRecords.has(am)) amRecords.set(am, []);
    amRecords.get(am)!.push(r);
    if (!amClients.has(am)) amClients.set(am, new Set());
    amClients.get(am)!.add(r.clientName);
  }

  for (const a of alerts) {
    const am = clientToAM.get(a.clientName) || "Unassigned";
    if (!amAlerts.has(am)) amAlerts.set(am, []);
    amAlerts.get(am)!.push(a);
  }

  // Also include AMs that have clients but no surveys in the period
  for (const c of clients) {
    const am = c.accountManager?.trim() || "Unassigned";
    if (!amClients.has(am)) amClients.set(am, new Set());
    amClients.get(am)!.add(c.clientSlug);
  }

  // Build entries for each AM
  const allAMs = new Set([
    ...amRecords.keys(),
    ...amClients.keys(),
    ...amAlerts.keys(),
  ]);

  const entries: AMLeaderboardEntry[] = [];

  for (const am of allAMs) {
    const recs = amRecords.get(am) || [];
    const alertList = amAlerts.get(am) || [];
    const clientSet = amClients.get(am) || new Set();

    // NPS monthly trend
    const npsMonthly = new Map<string, SurveyRecord[]>();
    for (const r of recs) {
      if (r.surveyType === "NPS" && r.npsScore !== null && r.submissionDate) {
        const m = getMonth(r.submissionDate);
        if (!npsMonthly.has(m)) npsMonthly.set(m, []);
        npsMonthly.get(m)!.push(r);
      }
    }
    const npsTrendMap = new Map<string, number>();
    for (const [m, monthRecs] of npsMonthly) {
      const promoters = monthRecs.filter((r) => r.npsScore! >= 9).length;
      const detractors = monthRecs.filter((r) => r.npsScore! <= 6).length;
      npsTrendMap.set(
        m,
        Math.round(((promoters - detractors) / monthRecs.length) * 100)
      );
    }

    // CSAT monthly trend
    const csatMonthly = new Map<string, SurveyRecord[]>();
    for (const r of recs) {
      if (r.surveyType === "CSAT" && r.csatScore !== null && r.submissionDate) {
        const m = getMonth(r.submissionDate);
        if (!csatMonthly.has(m)) csatMonthly.set(m, []);
        csatMonthly.get(m)!.push(r);
      }
    }
    const csatTrendMap = new Map<string, number>();
    for (const [m, monthRecs] of csatMonthly) {
      const sum = monthRecs.reduce((s, r) => s + r.csatScore!, 0);
      csatTrendMap.set(
        m,
        parseFloat((sum / monthRecs.length).toFixed(1))
      );
    }

    // Volume monthly trend
    const volumeMonthly = new Map<string, number>();
    for (const r of recs) {
      if (r.submissionDate) {
        const m = getMonth(r.submissionDate);
        volumeMonthly.set(m, (volumeMonthly.get(m) || 0) + 1);
      }
    }

    // Alert monthly trend
    const alertMonthly = new Map<string, number>();
    for (const a of alertList) {
      if (a.submissionDate) {
        const m = getMonth(a.submissionDate);
        alertMonthly.set(m, (alertMonthly.get(m) || 0) + 1);
      }
    }

    entries.push({
      accountManager: am,
      clientCount: clientSet.size,
      avgNps: computeNps(recs),
      npsResponseCount: recs.filter(
        (r) => r.surveyType === "NPS" && r.npsScore !== null
      ).length,
      avgCsat: computeAvgCsat(recs),
      csatResponseCount: recs.filter(
        (r) => r.surveyType === "CSAT" && r.csatScore !== null
      ).length,
      totalResponses: recs.length,
      alertCount: alertList.length,
      npsTrend: sortedMonthlyEntries(npsTrendMap),
      csatTrend: sortedMonthlyEntries(csatTrendMap),
      volumeTrend: sortedMonthlyEntries(volumeMonthly),
      alertTrend: sortedMonthlyEntries(alertMonthly),
    });
  }

  return entries;
}

// ─── Ranking ────────────────────────────────────────────────────────

function assignRanks(
  entries: AMLeaderboardEntry[],
  getValue: (e: AMLeaderboardEntry) => number | null,
  ascending: boolean
): RankedAMEntry[] {
  const sorted = [...entries].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    // Nulls always last
    if (va === null && vb === null)
      return a.accountManager.localeCompare(b.accountManager);
    if (va === null) return 1;
    if (vb === null) return -1;
    const diff = ascending ? va - vb : vb - va;
    if (diff !== 0) return diff;
    return a.accountManager.localeCompare(b.accountManager);
  });

  const ranked: RankedAMEntry[] = [];
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (
      i > 0 &&
      getValue(sorted[i]) !== null &&
      getValue(sorted[i]) === getValue(sorted[i - 1])
    ) {
      ranked.push({ ...sorted[i], rank: ranked[i - 1].rank });
    } else {
      ranked.push({ ...sorted[i], rank: currentRank });
    }
    currentRank = i + 2; // next position
  }

  return ranked;
}

export function rankByNps(entries: AMLeaderboardEntry[]): RankedAMEntry[] {
  return assignRanks(entries, (e) => e.avgNps, false);
}

export function rankByCsat(entries: AMLeaderboardEntry[]): RankedAMEntry[] {
  return assignRanks(entries, (e) => e.avgCsat, false);
}

export function rankByVolume(entries: AMLeaderboardEntry[]): RankedAMEntry[] {
  return assignRanks(entries, (e) => e.totalResponses, false);
}

export function rankByFewestAlerts(
  entries: AMLeaderboardEntry[]
): RankedAMEntry[] {
  return assignRanks(entries, (e) => e.alertCount, true);
}
