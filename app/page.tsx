"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

function SurveyForm() {
  const searchParams = useSearchParams();
  const client = searchParams.get("client") || "unknown";

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
        body: JSON.stringify({ client, score, feedback }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

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
          <h2
            className="mb-4 text-3xl font-bold"
            style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
          >
            Thank you!
          </h2>
          <p className="text-lg text-gray-600">
            Your feedback helps us improve. We appreciate you taking the time to
            share your thoughts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm sm:p-12">
        {/* Progress bar */}
        <div className="mb-10 flex gap-2">
          <div
            className="h-2 flex-1 rounded-full"
            style={{ backgroundColor: "#D90429" }}
          />
          <div
            className="h-2 flex-1 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: score !== null ? "#D90429" : "#e5e7eb",
            }}
          />
        </div>

        {/* Question 1: NPS Score */}
        <h1
          className="mb-3 text-2xl font-bold leading-tight sm:text-3xl"
          style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
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

        {/* Score buttons - Row 2: 6-10 (offset to sit between row above) */}
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

        {/* Score labels */}
        <div className="mb-10 flex justify-between text-sm text-gray-400">
          <span>Not likely</span>
          <span>Extremely likely</span>
        </div>

        {/* Question 2: Feedback (shown after score selection) */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            score !== null
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <label
            className="mb-3 block text-xl font-bold"
            style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
          >
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

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-semibold text-white transition-opacity cursor-pointer disabled:opacity-70"
            style={{ backgroundColor: "#D90429" }}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SurveyForm />
    </Suspense>
  );
}
