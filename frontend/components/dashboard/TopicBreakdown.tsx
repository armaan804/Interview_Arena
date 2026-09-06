"use client";

interface TopicStat {
  topicId: string;
  topicName: string;
  roleName: string;
  attempts: number;
  correct: number;
  accuracyPct: number;
}

function accuracyColor(pct: number) {
  if (pct >= 75) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export default function TopicBreakdown({ data }: { data: TopicStat[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No practice data yet — complete an MCQ session to see your breakdown.
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => a.accuracyPct - b.accuracyPct);

  return (
    <div className="space-y-3">
      {sorted.map((t) => (
        <div key={t.topicId}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700">
              {t.topicName}{" "}
              <span className="text-gray-400">({t.roleName})</span>
            </span>
            <span className="text-gray-500">
              {t.correct}/{t.attempts} · {t.accuracyPct}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${accuracyColor(t.accuracyPct)}`}
              style={{ width: `${t.accuracyPct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
