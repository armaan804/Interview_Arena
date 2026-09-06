"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth, API_URL } from "@/context/AuthContext";
import AuthGuard from "@/components/shared/AuthGuard";
import MCQPracticeSession from "@/components/mcq/MCQPracticeSession";

interface SanitizedQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}

const COUNT_OPTIONS = [5, 10, 15];

function SessionSetup({
  topicName,
  roleName,
  maxAvailable,
  onStart,
}: {
  topicName: string;
  roleName: string;
  maxAvailable: number;
  onStart: (count: number) => void;
}) {
  const applicableOptions = COUNT_OPTIONS.filter((n) => n < maxAvailable);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-1">
          {roleName} · {topicName}
        </p>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          How many questions?
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {applicableOptions.map((n) => (
            <button
              key={n}
              onClick={() => onStart(n)}
              className="border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-900 hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              {n} questions
            </button>
          ))}
          <button
            onClick={() => onStart(maxAvailable)}
            className={`border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-900 hover:border-indigo-500 hover:bg-indigo-50 transition ${
              applicableOptions.length % 2 === 1 ? "col-span-1" : "col-span-2"
            }`}
          >
            All ({maxAvailable})
          </button>
        </div>
      </div>
    </div>
  );
}

function MCQPracticeContent({
  roleId,
  topicId,
}: {
  roleId: string;
  topicId: string;
}) {
  const { token } = useAuth();
  const [maxAvailable, setMaxAvailable] = useState<number | null>(null);
  const [roleName, setRoleName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [sessionData, setSessionData] = useState<{
    roleName: string;
    topicName: string;
    questions: SanitizedQuestion[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Step 1: find out how many questions exist for this topic
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/topics/${roleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load topic.");
        const topic = data.role.topics.find(
          (t: { id: string }) => t.id === topicId
        );
        if (!topic) throw new Error("Topic not found.");
        setRoleName(data.role.name);
        setTopicName(topic.name);
        setMaxAvailable(topic._count.mcqQuestions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, roleId, topicId]);

  // Step 2: fetch the actual question set once the user picks a count
  async function startSession(count: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/api/mcq/questions/${topicId}?count=${count}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load questions.");
      setSessionData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 px-4 py-12">Loading...</p>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <Link
          href={`/practice/mcq/${roleId}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to topics
        </Link>
      </div>
    );
  }

  if (!sessionData) {
    if (maxAvailable === null || maxAvailable === 0) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-sm text-gray-500 mb-2">
            No questions available for this topic yet.
          </p>
          <Link
            href={`/practice/mcq/${roleId}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back to topics
          </Link>
        </div>
      );
    }
    return (
      <SessionSetup
        topicName={topicName}
        roleName={roleName}
        maxAvailable={maxAvailable}
        onStart={startSession}
      />
    );
  }

  return (
    <MCQPracticeSession
      roleId={roleId}
      roleName={sessionData.roleName}
      topicId={topicId}
      topicName={sessionData.topicName}
      questions={sessionData.questions}
    />
  );
}

export default function MCQPracticePage({
  params,
}: {
  params: Promise<{ roleId: string; topicId: string }>;
}) {
  const { roleId, topicId } = use(params);
  return (
    <AuthGuard>
      <MCQPracticeContent roleId={roleId} topicId={topicId} />
    </AuthGuard>
  );
}
