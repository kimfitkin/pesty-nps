"use client";

import { use } from "react";
import { NPSSurvey, CSATSurvey, SurveyError, type Milestone } from "../survey-components";

// Known CSAT milestone slugs (used to parse the URL unambiguously)
const MILESTONE_SLUG_MAP: Record<string, Milestone> = {
  "onboarding": "Onboarding",
  "website-launch": "Website Launch",
  "monthly-call": "Monthly Call",
  "first-90-days": "First 90 Days",
};

// Ordered by longest first so we match greedily
const MILESTONE_SLUGS = Object.keys(MILESTONE_SLUG_MAP).sort(
  (a, b) => b.length - a.length
);

function parseSlug(slug: string): {
  type: "nps" | "csat";
  client: string;
  milestone?: Milestone;
} | null {
  // NPS: nps-{client-name}
  if (slug.startsWith("nps-")) {
    const client = slug.slice(4); // everything after "nps-"
    if (!client) return null;
    return { type: "nps", client };
  }

  // CSAT: csat-{milestone}-{client-name}
  if (slug.startsWith("csat-")) {
    const rest = slug.slice(5); // everything after "csat-"
    if (!rest) return null;

    // Try to match a known milestone at the start
    for (const milestoneSlug of MILESTONE_SLUGS) {
      if (rest.startsWith(milestoneSlug + "-")) {
        const client = rest.slice(milestoneSlug.length + 1);
        if (!client) return null;
        return {
          type: "csat",
          client,
          milestone: MILESTONE_SLUG_MAP[milestoneSlug],
        };
      }
    }

    return null; // no valid milestone found
  }

  return null;
}

export default function SlugSurveyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const parsed = parseSlug(slug);

  if (!parsed) {
    return (
      <SurveyError message="This survey link appears to be invalid. Please contact your account manager." />
    );
  }

  if (parsed.type === "nps") {
    return <NPSSurvey client={parsed.client} />;
  }

  if (parsed.type === "csat" && parsed.milestone) {
    return <CSATSurvey client={parsed.client} milestone={parsed.milestone} />;
  }

  return (
    <SurveyError message="This survey link appears to be incomplete. Please contact your account manager." />
  );
}
