export interface SurveyRecord {
  id: string;
  clientName: string;
  surveyType: "NPS" | "CSAT";
  milestone: string | null;
  npsScore: number | null;
  csatScore: number | null;
  followUpScore: number | null;
  feedback: string;
  npsType: string | null; // AI-generated in Airtable
  csatType: string | null; // AI-generated in Airtable
  submissionDate: string; // YYYY-MM-DD
}

export interface DashboardSummary {
  currentNps: number; // % promoters - % detractors
  totalNpsResponses: number;
  averageCsat: number; // X out of 5
  totalCsatResponses: number;
  totalResponses: number;
}

export interface AlertRecord {
  id: string;
  clientName: string;
  surveyType: "NPS" | "CSAT";
  score: number;
  category: string;
  milestone: string | null;
  feedback: string;
  submissionDate: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentResponses: SurveyRecord[];
  alerts: AlertRecord[];
}
