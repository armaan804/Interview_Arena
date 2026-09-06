"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, API_URL } from "@/context/AuthContext";

type QuestionType = "TECHNICAL" | "HR" | "BEHAVIORAL";
type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type Rating = "Strong" | "Good" | "Needs Improvement" | null;

interface InterviewQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  difficulty: Difficulty;
}

interface ResultRecord {
  questionId: string;
  questionText: string;
  type: QuestionType;
  answerText: string;
  feedback: string;
  rating: Rating;
}

const TYPE_STYLES: Record<QuestionType, string> = {
  TECHNICAL: "bg-blue-100 text-blue-700",
  HR: "bg-pink-100 text-pink-700",
  BEHAVIORAL: "bg-amber-100 text-amber-700",
};

const RATING_STYLES: Record<string, string> = {
  Strong: "bg-green-100 text-green-700",
  Good: "bg-blue-100 text-blue-700",
  "Needs Improvement": "bg-red-100 text-red-700",
};

export default function MockInterviewSession({
  roleId,
  roleName,
  sessionId,
  questions,
}: {
  roleId: string;
  roleName: string;
  sessionId: string;
  questions: InterviewQuestion[];
}) {
  const { token } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [savedAnswers, setSavedAnswers] = useState<
    { question: InterviewQuestion; answerText: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<"practice" | "evaluating" | "review">(
    "practice"
  );
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex + 1 === questions.length;

  async function saveCurrentAnswer() {
    if (!answerText.trim() || !currentQuestion) return null;

    const res = await fetch(`${API_URL}/api/mock-interview/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        questionId: currentQuestion.id,
        answerText,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save your answer.");
    return { question: currentQuestion, answerText };
  }

  async function handleNext() {
    setSaving(true);
    setError("");

    try {
      const saved = await saveCurrentAnswer();
      if (!saved) {
        setSaving(false);
        return;
      }

      const updatedAnswers = [...savedAnswers, saved];
      setSavedAnswers(updatedAnswers);
      setAnswerText("");

      if (!isLastQuestion) {
        setCurrentIndex(currentIndex + 1);
        setSaving(false);
        return;
      }

      // Last question — move to evaluation phase
      setPhase("evaluating");
      const res = await fetch(`${API_URL}/api/mock-interview/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate your interview.");

      setResults(data.results);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("practice");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Evaluating screen ----------
  if (phase === "evaluating") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            Evaluating your interview answers...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This can take a few seconds for {questions.length} questions.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Review screen ----------
  if (phase === "review") {
    const ratingCounts = results.reduce(
      (acc, r) => {
        if (r.rating) acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Mock interview complete
          </h1>
          <p className="text-sm text-gray-500 mb-6">{roleName}</p>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex gap-6 flex-wrap">
            {(["Strong", "Good", "Needs Improvement"] as const).map((r) => (
              <div key={r}>
                <p className="text-2xl font-semibold text-gray-900">
                  {ratingCounts[r] || 0}
                </p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_STYLES[r]}`}
                >
                  {r}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-6">
            {results.map((r, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[r.type]}`}
                  >
                    {r.type}
                  </span>
                  {r.rating && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_STYLES[r.rating]}`}
                    >
                      {r.rating}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {r.questionText}
                </p>
                <p className="text-sm text-gray-600 mb-2 italic">
                  &ldquo;{r.answerText}&rdquo;
                </p>
                <p className="text-sm text-gray-500">{r.feedback}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              href={`/practice/interview/${roleId}`}
              className="text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100"
            >
              Practice again
            </Link>
            <Link
              href="/dashboard"
              className="text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:underline"
            >
              View dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Practice screen ----------
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{roleName} · Mock Interview</p>
          <p className="text-sm text-gray-500">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{
              width: `${(currentIndex / questions.length) * 100}%`,
            }}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <span
            className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${TYPE_STYLES[currentQuestion.type]}`}
          >
            {currentQuestion.type}
          </span>

          <h2 className="text-lg font-medium text-gray-900 mb-5">
            {currentQuestion.questionText}
          </h2>

          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={6}
            placeholder="Type your answer here..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <p className="text-xs text-gray-400 mt-2">
            You won&apos;t see feedback until the full interview is done —
            just like a real interview.
          </p>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!answerText.trim() || saving}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving
                ? isLastQuestion
                  ? "Finishing..."
                  : "Saving..."
                : isLastQuestion
                  ? "Finish interview"
                  : "Next question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}