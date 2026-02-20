"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ─── Shared helpers ──────────────────────────────────────────────

const HEADING_STYLE = { color: "#002330", fontFamily: "var(--font-epilogue)" };

function getScoreStyle(isSelected: boolean) {
  if (isSelected) {
    return {
      backgroundColor: "#D90429",
      borderColor: "#D90429",
      color: "#ffffff",
    };
  }
  return {
    backgroundColor: "#F1F7FB",
    borderColor: "#d1dce3",
    color: "#002330",
  };
}

function SubmitButton({
  isSubmitting,
  onClick,
  disabled,
}: {
  isSubmitting: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-semibold text-white transition-opacity cursor-pointer disabled:opacity-70"
      style={{ backgroundColor: "#D90429" }}
    >
      {isSubmitting ? (
        <>
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Submitting...
        </>
      ) : (
        "Submit Feedback"
      )}
    </button>
  );
}

function ThankYou({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-10 w-10 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="mb-4 text-3xl font-bold" style={HEADING_STYLE}>
          Thank you!
        </h2>
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    </div>
  );
}

function ProgressBar({ steps, currentStep }: { steps: number; currentStep: number }) {
  return (
    <div className="mb-10 flex gap-2">
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className="h-2 flex-1 rounded-full transition-colors duration-500"
          style={{
            backgroundColor: i < currentStep ? "#D90429" : "#e5e7eb",
          }}
        />
      ))}
    </div>
  );
}

function StarIcon({ filled, size = 48 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#D90429" : "none"}
      stroke={filled ? "#D90429" : "#d1dce3"}
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

// ─── Milestone config ────────────────────────────────────────────

type Milestone = "Onboarding" | "Website Launch" | "Monthly Call" | "First 90 Days";

const MILESTONE_QUESTIONS: Record<
  Milestone,
  { csatQuestion: string; followUpQuestion: string }
> = {
  Onboarding: {
    csatQuestion: "How satisfied are you with your onboarding experience?",
    followUpQuestion:
      "How clear were the next steps and expectations after onboarding?",
  },
  "Website Launch": {
    csatQuestion: "How satisfied are you with your new website?",
    followUpQuestion: "How well does the website match what you expected?",
  },
  "Monthly Call": {
    csatQuestion:
      "How satisfied are you with the clarity of your performance updates?",
    followUpQuestion:
      "How confident are you that we're focused on the right priorities?",
  },
  "First 90 Days": {
    csatQuestion: "How satisfied are you with Pesty Marketing so far?",
    followUpQuestion:
      "How would you rate the communication from your account team?",
  },
};

const FOLLOW_UP_LABELS = ["Poor", "Fair", "Okay", "Good", "Excellent"];

// URL param to Airtable milestone name mapping
const MILESTONE_MAP: Record<string, Milestone> = {
  onboarding: "Onboarding",
  website_launch: "Website Launch",
  monthly_call: "Monthly Call",
  first_90_days: "First 90 Days",
};

// ─── NPS Survey ──────────────────────────────────────────────────

function NPSSurvey({ client }: { client: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit() {
    if (score === null) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          surveyType: "nps",
          npsScore: score,
          feedback,
        }),
      });

      if (!response.ok) throw new Error("Submission failed");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <ThankYou message="Your feedback helps us improve. We appreciate you taking the time to share your thoughts." />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <ProgressBar steps={2} currentStep={score !== null ? 2 : 1} />

        <h1
          className="mb-3 text-2xl font-bold leading-tight sm:text-3xl"
          style={HEADING_STYLE}
        >
          How likely are you to recommend Pesty Marketing to another pest
          control company?
        </h1>
        <p className="mb-8 text-base text-gray-500">
          Select a score from 0 (not likely) to 10 (extremely likely)
        </p>

        {/* Score buttons - Row 1: 0-5 */}
        <div className="mb-3 flex justify-center gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-base font-semibold transition-all duration-200 cursor-pointer sm:h-16 sm:w-16 sm:text-lg ${score === i ? "scale-110 shadow-md" : "hover:opacity-80"}`}
              style={getScoreStyle(score === i)}
            >
              {i}
            </button>
          ))}
        </div>

        {/* Score buttons - Row 2: 6-10 */}
        <div className="mb-3 flex justify-center gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i + 6}
              onClick={() => setScore(i + 6)}
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-base font-semibold transition-all duration-200 cursor-pointer sm:h-16 sm:w-16 sm:text-lg ${score === i + 6 ? "scale-110 shadow-md" : "hover:opacity-80"}`}
              style={getScoreStyle(score === i + 6)}
            >
              {i + 6}
            </button>
          ))}
        </div>

        <div className="mb-10 flex justify-between text-sm text-gray-400">
          <span>Not likely</span>
          <span>Extremely likely</span>
        </div>

        {/* Feedback */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            score !== null ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <label className="mb-3 block text-xl font-bold" style={HEADING_STYLE}>
            What&apos;s one thing we can do better?
            <span className="ml-2 text-sm font-normal text-gray-400">
              Optional
            </span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="mb-8 w-full resize-none rounded-xl border border-gray-200 p-4 text-base transition-colors focus:border-gray-400 focus:outline-none"
          />
          <SubmitButton isSubmitting={isSubmitting} onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

// ─── CSAT Survey ─────────────────────────────────────────────────

function CSATSurvey({
  client,
  milestone,
}: {
  client: string;
  milestone: Milestone;
}) {
  const questions = MILESTONE_QUESTIONS[milestone];

  const [csatScore, setCsatScore] = useState<number | null>(null);
  const [followUpScore, setFollowUpScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate current progress step
  const currentStep =
    csatScore === null ? 1 : followUpScore === null ? 2 : 3;

  async function handleSubmit() {
    if (csatScore === null) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client,
          surveyType: "csat",
          milestone,
          csatScore,
          followUpScore,
          feedback,
        }),
      });

      if (!response.ok) throw new Error("Submission failed");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    const message =
      csatScore !== null && csatScore <= 2
        ? "We take this seriously. Your account manager will follow up with you shortly."
        : "Thanks, your feedback helps us keep improving.";
    return <ThankYou message={message} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        <ProgressBar steps={3} currentStep={currentStep} />

        {/* Step 1: CSAT Rating (Stars) */}
        <h1
          className="mb-3 text-2xl font-bold leading-tight sm:text-3xl"
          style={HEADING_STYLE}
        >
          {questions.csatQuestion}
        </h1>
        <p className="mb-8 text-base text-gray-500">
          Select a rating from 1 to 5 stars
        </p>

        <div className="mb-10 flex justify-center gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCsatScore(i + 1)}
              className={`cursor-pointer transition-all duration-200 ${
                csatScore !== null && i + 1 <= csatScore
                  ? "scale-110"
                  : "hover:scale-105 opacity-60 hover:opacity-80"
              }`}
              style={{ minWidth: "48px", minHeight: "48px" }}
            >
              <StarIcon
                filled={csatScore !== null && i + 1 <= csatScore}
                size={48}
              />
            </button>
          ))}
        </div>

        {/* Step 2: Follow-Up Score (shown after CSAT rating) */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            csatScore !== null ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <h2
            className="mb-3 text-xl font-bold leading-tight sm:text-2xl"
            style={HEADING_STYLE}
          >
            {questions.followUpQuestion}
          </h2>
          <p className="mb-6 text-base text-gray-500">
            Rate from 1 (Poor) to 5 (Excellent)
          </p>

          <div className="mb-10 flex justify-center gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setFollowUpScore(i + 1)}
                className={`flex h-14 w-20 flex-col items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all duration-200 cursor-pointer sm:h-16 sm:w-24 sm:text-base ${
                  followUpScore === i + 1
                    ? "scale-105 shadow-md"
                    : "hover:opacity-80"
                }`}
                style={getScoreStyle(followUpScore === i + 1)}
              >
                <span>{i + 1}</span>
                <span
                  className="text-xs font-normal"
                  style={{
                    color:
                      followUpScore === i + 1 ? "#ffffff" : "#9ca3af",
                  }}
                >
                  {FOLLOW_UP_LABELS[i]}
                </span>
              </button>
            ))}
          </div>

          {/* Step 3: Feedback (shown after follow-up score) */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              followUpScore !== null
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <label
              className="mb-3 block text-xl font-bold"
              style={HEADING_STYLE}
            >
              Anything else we should know?
              <span className="ml-2 text-sm font-normal text-gray-400">
                Optional
              </span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="mb-8 w-full resize-none rounded-xl border border-gray-200 p-4 text-base transition-colors focus:border-gray-400 focus:outline-none"
            />
            <SubmitButton isSubmitting={isSubmitting} onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────

function SurveyError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-10 w-10 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="mb-4 text-2xl font-bold" style={HEADING_STYLE}>
          Oops
        </h2>
        <p className="text-lg text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────────

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

// ─── Page export ─────────────────────────────────────────────────

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SurveyRouter />
    </Suspense>
  );
}
