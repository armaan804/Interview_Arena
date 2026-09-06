"use client";

interface RoleStat {
  roleId: string;
  roleName: string;
  questionsAttempted: number;
  totalQuestionsInRole: number;
  coveragePct: number;
  accuracyPct: number;
  readinessScore: number;
}

function readinessColor(score: number) {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

export default function ReadinessScore({ data }: { data: RoleStat[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Practice a role to see your readiness score.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data.map((r) => (
        <div
          key={r.roleId}
          className="border border-gray-200 rounded-xl p-4 bg-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">{r.roleName}</h3>
            <span
              className={`text-lg font-semibold ${readinessColor(r.readinessScore)}`}
            >
              {r.readinessScore}%
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Coverage: {r.questionsAttempted}/{r.totalQuestionsInRole} questions
            ({r.coveragePct}%)
          </p>
          <p className="text-xs text-gray-500">
            Accuracy on attempted questions: {r.accuracyPct}%
          </p>
        </div>
      ))}
    </div>
  );
}
