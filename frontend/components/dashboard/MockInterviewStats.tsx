"use client";

interface RatingCounts {
  Strong: number;
  Good: number;
  "Needs Improvement": number;
  [key: string]: number;
}

interface MLQualityCounts {
  GOOD: number;
  AVERAGE: number;
  WEAK: number;
  [key: string]: number;
}

interface InterviewRoleStat {
  roleId: string;
  roleName: string;
  sessionsCompleted: number;
  questionsAnswered: number;
  ratingCounts: RatingCounts;
}

interface MockInterviewStatsData {
  totalSessions: number;
  totalQuestionsAnswered: number;
  ratingCounts: RatingCounts;
  mlQualityCounts: MLQualityCounts;
  byRole: InterviewRoleStat[];
}

const RATING_COLORS: Record<string, string> = {
  Strong: "bg-green-500",
  Good: "bg-blue-500",
  "Needs Improvement": "bg-red-500",
};

const ML_COLORS: Record<string, string> = {
  GOOD: "bg-green-500",
  AVERAGE: "bg-yellow-500",
  WEAK: "bg-red-500",
};

function DistributionBar({
  counts,
  colors,
}: {
  counts: Record<string, number>;
  colors: Record<string, string>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return <p className="text-sm text-gray-500">No data yet.</p>;
  }

  return (
    <div>
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 mb-2">
        {Object.entries(counts).map(([label, count]) =>
          count > 0 ? (
            <div
              key={label}
              className={colors[label]}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${label}: ${count}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {Object.entries(counts).map(([label, count]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${colors[label]}`} />
            {label}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MockInterviewStats({ data }: { data: MockInterviewStatsData }) {
  if (data.totalSessions === 0) {
    return (
      <p className="text-sm text-gray-500">
        No mock interviews completed yet — try one from the Roles page.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-semibold text-gray-900">
            {data.totalSessions}
          </p>
          <p className="text-xs text-gray-500">Interviews completed</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-semibold text-gray-900">
            {data.totalQuestionsAnswered}
          </p>
          <p className="text-xs text-gray-500">Questions answered</p>
        </div>
      </div>

      {/* Gemini rating distribution */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          AI Interviewer Ratings (Gemini)
        </h3>
        <DistributionBar counts={data.ratingCounts} colors={RATING_COLORS} />
      </div>

      {/* ML model distribution */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          ML Model Quality Scores
        </h3>
        <DistributionBar counts={data.mlQualityCounts} colors={ML_COLORS} />
      </div>

      {/* Per-role breakdown */}
      {data.byRole.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">By Role</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.byRole.map((r) => (
              <div
                key={r.roleId}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {r.roleName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {r.sessionsCompleted} session
                    {r.sessionsCompleted !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {r.questionsAnswered} question
                  {r.questionsAnswered !== 1 ? "s" : ""} answered
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
