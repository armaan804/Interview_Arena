"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, API_URL } from "@/context/AuthContext";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface SanitizedQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: Difficulty;
}

interface GradeResult {
  isCorrect: boolean;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

interface AnsweredRecord {
  question: SanitizedQuestion;
  selectedOption: "A" | "B" | "C" | "D";
  result: GradeResult;
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  BEGINNER: "bg-green-100 text-green-700",
  INTERMEDIATE: "bg-yellow-100 text-yellow-700",
  ADVANCED: "bg-red-100 text-red-700",
};

export default function MCQPracticeSession({
  roleId,
  roleName,
  topicId,
  topicName,
  questions,
}: {
  roleId: string;
  roleName: string;
  topicId: string;
  topicName: string;
  questions: SanitizedQuestion[];
}) {
  const { token } = useAuth();
  const [queue, setQueue] = useState<SanitizedQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState<AnsweredRecord[]>([]);
  const [phase, setPhase] = useState<"practice" | "review">("practice");
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [error, setError] = useState("");

  const currentQuestion = queue[currentIndex];

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex, queue]);

  const submitAnswer = useCallback(async () => {
    if (!selected || !currentQuestion) return;
    setSubmitting(true);
    setError("");

    const timeTakenSec = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const res = await fetch(`${API_URL}/api/mcq/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOption: selected,
          timeTakenSec,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to grade this question.");
        setSubmitting(false);
        return;
      }

      setResult(data);
      setAnswered((prev) => [
        ...prev,
        { question: currentQuestion, selectedOption: selected, result: data },
      ]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selected, currentQuestion, questionStartTime, token]);

  function goNext() {
    setSelected(null);
    setResult(null);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase("review");
    }
  }

  function retryWrongOnly() {
    const wrongQuestions = answered
      .filter((a) => !a.result.isCorrect)
      .map((a) => a.question);
    if (wrongQuestions.length === 0) return;
    setQueue(wrongQuestions);
    setAnswered([]);
    setCurrentIndex(0);
    setSelected(null);
    setResult(null);
    setPhase("practice");
  }

  // ---------- Review screen ----------
  if (phase === "review") {
    const correctCount = answered.filter((a) => a.result.isCorrect).length;
    const total = answered.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const wrongAnswers = answered.filter((a) => !a.result.isCorrect);

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Session complete — {topicName}
          </h1>
          <p className="text-sm text-gray-500 mb-6">{roleName}</p>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex items-center justify-between">
            <div>
              <p className="text-3xl font-semibold text-gray-900">
                {correctCount}/{total}
              </p>
              <p className="text-sm text-gray-500">{accuracy}% accuracy</p>
            </div>
            {wrongAnswers.length > 0 && (
              <button
                onClick={retryWrongOnly}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Retry wrong questions ({wrongAnswers.length})
              </button>
            )}
          </div>

          {wrongAnswers.length > 0 && (
            <div className="space-y-4 mb-6">
              <h2 className="font-medium text-gray-900">Review mistakes</h2>
              {wrongAnswers.map((a, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl p-4"
                >
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {a.question.questionText}
                  </p>
                  <p className="text-sm text-red-600 mb-1">
                    Your answer: {a.selectedOption} —{" "}
                    {
                      a.question[
                        `option${a.selectedOption}` as keyof SanitizedQuestion
                      ]
                    }
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    Correct answer: {a.result.correctOption} —{" "}
                    {
                      a.question[
                        `option${a.result.correctOption}` as keyof SanitizedQuestion
                      ]
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {a.result.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={`/practice/mcq/${roleId}`}
              className="text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100"
            >
              Choose another topic
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
          <p className="text-sm text-gray-500">
            {roleName} · {topicName}
          </p>
          <p className="text-sm text-gray-500">
            Question {currentIndex + 1} of {queue.length}
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{
              width: `${((currentIndex + (result ? 1 : 0)) / queue.length) * 100}%`,
            }}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <span
            className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${DIFFICULTY_STYLES[currentQuestion.difficulty]}`}
          >
            {currentQuestion.difficulty}
          </span>

          <h2 className="text-lg font-medium text-gray-900 mb-5">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {OPTION_KEYS.map((key) => {
              const optionText = currentQuestion[
                `option${key}` as keyof SanitizedQuestion
              ] as string;

              let stateClasses =
                "border-gray-300 hover:border-indigo-400";
              if (result) {
                if (key === result.correctOption) {
                  stateClasses = "border-green-500 bg-green-50";
                } else if (key === selected && !result.isCorrect) {
                  stateClasses = "border-red-500 bg-red-50";
                } else {
                  stateClasses = "border-gray-200 opacity-60";
                }
              } else if (key === selected) {
                stateClasses = "border-indigo-600 bg-indigo-50";
              }

              return (
                <button
                  key={key}
                  disabled={!!result}
                  onClick={() => setSelected(key)}
                  className={`w-full text-left border rounded-lg px-4 py-3 text-sm text-gray-900 transition ${stateClasses}`}
                >
                  <span className="font-medium mr-2">{key}.</span>
                  {optionText}
                </button>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

          {result && (
            <div
              className={`mt-5 p-4 rounded-lg text-sm ${
                result.isCorrect
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <p className="font-medium mb-1">
                {result.isCorrect ? "Correct!" : "Not quite."}
              </p>
              <p>{result.explanation}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            {!result ? (
              <button
                onClick={submitAnswer}
                disabled={!selected || submitting}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Checking..." : "Submit answer"}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                {currentIndex + 1 < queue.length ? "Next question" : "Finish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
