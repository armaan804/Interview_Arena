"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAuth, API_URL } from "@/context/AuthContext";
import AuthGuard from "@/components/shared/AuthGuard";
import MockInterviewSession from "@/components/mock-interview/MockInterviewSession";

type QuestionType = "TECHNICAL" | "HR" | "BEHAVIORAL";
type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface InterviewQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  difficulty: Difficulty;
}

const COUNT_OPTIONS = [3, 5, 8];

function SessionSetup({
  onStart,
  loading,
}: {
  onStart: (count: number) => void;
  loading: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Mock Interview
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          A mix of technical, HR, and behavioral questions. Answer in your own
          words — you&apos;ll get AI feedback after each one.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              disabled={loading}
              onClick={() => onStart(n)}
              className="border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-900 hover:border-indigo-500 hover:bg-indigo-50 transition disabled:opacity-50"
            >
              {n} questions
            </button>
          ))}
        </div>
        {loading && (
          <p className="text-sm text-gray-500 mt-4">Starting session...</p>
        )}
      </div>
    </div>
  );
}

function MockInterviewContent({ roleId }: { roleId: string }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<{
    sessionId: string;
    roleName: string;
    questions: InterviewQuestion[];
  } | null>(null);

  async function startSession(count: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/mock-interview/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleId, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start session.");
      setSession(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <Link href="/roles" className="text-sm text-indigo-600 hover:underline">
          ← Back to roles
        </Link>
      </div>
    );
  }

  if (!session) {
    return <SessionSetup onStart={startSession} loading={loading} />;
  }

  return (
    <MockInterviewSession
      roleId={roleId}
      roleName={session.roleName}
      sessionId={session.sessionId}
      questions={session.questions}
    />
  );
}

export default function MockInterviewPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = use(params);
  return (
    <AuthGuard>
      <MockInterviewContent roleId={roleId} />
    </AuthGuard>
  );
}
