"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NPSSurvey, CSATSurvey, SurveyError, type Milestone } from "./survey-components";

// URL param to Airtable milestone name mapping
const MILESTONE_MAP: Record<string, Milestone> = {
  onboarding: "Onboarding",
  website_launch: "Website Launch",
  monthly_call: "Monthly Call",
  first_90_days: "First 90 Days",
};

function SurveyRouter() {
  const searchParams = useSearchParams();
  const client = searchParams.get("client") || "unknown";
  const type = searchParams.get("type") || "nps";
  const milestoneParam = searchParams.get("milestone");

  if (type === "csat") {
    if (!milestoneParam) {
      return (
        <SurveyError message="This survey link appears to be incomplete. Please contact your account manager." />
      );
    }

    const milestone = MILESTONE_MAP[milestoneParam];
    if (!milestone) {
      return (
        <SurveyError message="This survey link appears to be incomplete. Please contact your account manager." />
      );
    }

    return <CSATSurvey client={client} milestone={milestone} />;
  }

  return <NPSSurvey client={client} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ color: "var(--text-muted)" }}
        >
          Loading...
        </div>
      }
    >
      <SurveyRouter />
    </Suspense>
  );
}
