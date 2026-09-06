"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth, API_URL } from "@/context/AuthContext";
import AuthGuard from "@/components/shared/AuthGuard";

interface Topic {
  id: string;
  name: string;
  _count: { mcqQuestions: number };
}

interface RoleWithTopics {
  id: string;
  name: string;
  topics: Topic[];
}

function TopicSelectionContent({ roleId }: { roleId: string }) {
  const { token } = useAuth();
  const [role, setRole] = useState<RoleWithTopics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/topics/${roleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load topics.");
        setRole(data.role);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, roleId]);

  if (loading) {
    return <p className="text-sm text-gray-500 px-4 py-12">Loading topics...</p>;
  }

  if (error || !role) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-sm text-red-600">{error || "Role not found."}</p>
        <Link href="/roles" className="text-sm text-indigo-600 hover:underline">
          ← Back to roles
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/roles"
          className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
        >
          ← Back to roles
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {role.name} — Practice Topics
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Pick a topic to start an MCQ practice session.
        </p>

        {role.topics.length === 0 ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            No topics available for this role yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {role.topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/practice/mcq/${role.id}/${topic.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-sm transition"
              >
                <h2 className="font-medium text-gray-900 mb-1">
                  {topic.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {topic._count.mcqQuestions} question
                  {topic._count.mcqQuestions !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopicSelectionPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = use(params);
  return (
    <AuthGuard>
      <TopicSelectionContent roleId={roleId} />
    </AuthGuard>
  );
}
