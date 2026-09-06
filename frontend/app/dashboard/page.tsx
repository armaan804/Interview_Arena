"use client";

import { useEffect, useState } from "react";
import { useAuth, API_URL } from "@/context/AuthContext";
import AuthGuard from "@/components/shared/AuthGuard";
import TopicRadarChart from "@/components/dashboard/RadarChart";
import TopicBreakdown from "@/components/dashboard/TopicBreakdown";
import ReadinessScore from "@/components/dashboard/ReadinessScore";
import TrendChart from "@/components/dashboard/TrendChart";

interface DashboardStats {
  overall: { totalAttempts: number; correctAttempts: number; accuracyPct: number };
  byTopic: {
    topicId: string;
    topicName: string;
    roleName: string;
    attempts: number;
    correct: number;
    accuracyPct: number;
  }[];
  byRole: {
    roleId: string;
    roleName: string;
    questionsAttempted: number;
    totalQuestionsInRole: number;
    coveragePct: number;
    accuracyPct: number;
    readinessScore: number;
  }[];
  recentTrend: { date: string; attempts: number; accuracyPct: number }[];
}

function DashboardContent() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load dashboard.");
        setStats(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <p className="text-sm text-gray-500 px-4 py-12">Loading dashboard...</p>;
  }

  if (error || !stats) {
    return <p className="text-sm text-red-600 px-4 py-12">{error}</p>;
  }

  const { overall, byTopic, byRole, recentTrend } = stats;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Your Progress
          </h1>
          <p className="text-sm text-gray-500">
            Based on {overall.totalAttempts} question
            {overall.totalAttempts !== 1 ? "s" : ""} attempted so far.
          </p>
        </div>

        {/* Overall summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-semibold text-gray-900">
              {overall.totalAttempts}
            </p>
            <p className="text-xs text-gray-500">Questions attempted</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-semibold text-gray-900">
              {overall.correctAttempts}
            </p>
            <p className="text-xs text-gray-500">Correct answers</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-2xl font-semibold text-indigo-600">
              {overall.accuracyPct}%
            </p>
            <p className="text-xs text-gray-500">Overall accuracy</p>
          </div>
        </div>

        {/* Role readiness */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">Role Readiness</h2>
          <ReadinessScore data={byRole} />
        </div>

        {/* Accuracy trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-900 mb-3">Accuracy Trend</h2>
          <TrendChart data={recentTrend} />
        </div>

        {/* Topic strength radar */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-900 mb-3">
            Strength by Topic
          </h2>
          <TopicRadarChart data={byTopic} />
        </div>

        {/* Topic-wise breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-medium text-gray-900 mb-3">
            Topic-wise Breakdown
          </h2>
          <TopicBreakdown data={byTopic} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
