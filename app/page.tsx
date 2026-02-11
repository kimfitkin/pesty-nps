"use client";

import { useState } from "react";

function getScoreColor(score: number, isSelected: boolean) {
  if (score <= 6) {
    return isSelected
      ? "bg-rose-500 text-white border-rose-500"
      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
  }
  if (score <= 8) {
    return isSelected
      ? "bg-amber-500 text-white border-amber-500"
      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  }
  return isSelected
    ? "bg-emerald-500 text-white border-emerald-500"
    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
}

export default function Home() {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
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
            className="mb-3 text-2xl font-bold"
            style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
          >
            Thank you!
          </h2>
          <p className="text-gray-600">
            Your feedback helps us improve. We appreciate you taking the time to
            share your thoughts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-sm sm:p-10">
        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          <div
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: "#D90429" }}
          />
          <div
            className="h-1.5 flex-1 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: score !== null ? "#D90429" : "#e5e7eb",
            }}
          />
        </div>

        {/* Question 1: NPS Score */}
        <h1
          className="mb-2 text-xl font-bold leading-tight sm:text-2xl"
          style={{ color: "#002330", fontFamily: "var(--font-epilogue)" }}
        >
          How likely are you to recommend Pesty Marketing to another pest
          control company?
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Select a score from 0 (not likely) to 10 (extremely likely)
        </p>

        {/* Score buttons */}
        <div className="mb-2 grid grid-cols-11 gap-1.5 sm:gap-2">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`flex aspect-square items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all duration-200 cursor-pointer sm:text-base ${getScoreColor(i, score === i)} ${score === i ? "scale-110 shadow-md" : ""}`}
              style={{ minHeight: "44px" }}
            >
              {i}
            </button>
          ))}
        </div>

        {/* Score labels */}
        <div className="mb-8 flex justify-between text-xs text-gray-400">
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
            className="mb-2 block text-lg font-bold"
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
            rows={3}
            className="mb-6 w-full resize-none rounded-xl border border-gray-200 p-4 text-sm transition-colors focus:border-gray-400 focus:outline-none"
          />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white transition-opacity cursor-pointer disabled:opacity-70"
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
