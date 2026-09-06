"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface TopicStat {
  topicName: string;
  accuracyPct: number;
}

export default function TopicRadarChart({ data }: { data: TopicStat[] }) {
  if (data.length < 3) {
    return (
      <p className="text-sm text-gray-500">
        Practice at least 3 different topics to unlock the strength radar
        chart.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    topic: d.topicName,
    accuracy: d.accuracyPct,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="topic"
          tick={{ fill: "#374151", fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
        />
        <Radar
          name="Accuracy"
          dataKey="accuracy"
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
