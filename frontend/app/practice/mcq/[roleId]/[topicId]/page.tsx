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

function MCQPracticeContent({
  roleId,
  topicId,
}: {
  roleId: string;
  topicId: string;
}) {
  const { token } = useAuth();
  const [data, setData] = useState<{
    roleName: string;
    topicName: string;
    questions: SanitizedQuestion[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/mcq/questions/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load questions.");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, topicId]);

  if (loading) {
    return <p className="text-sm text-gray-500 px-4 py-12">Loading questions...</p>;
  }

  if (error || !data || data.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-red-600 mb-2">
          {error || "No questions available for this topic yet."}
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
    <MCQPracticeSession
      roleId={roleId}
      roleName={data.roleName}
      topicId={topicId}
      topicName={data.topicName}
      questions={data.questions}
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
