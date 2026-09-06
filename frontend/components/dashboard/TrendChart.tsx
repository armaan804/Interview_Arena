"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  date: string;
  attempts: number;
  accuracyPct: number;
}

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No activity yet — your accuracy trend will appear here after your
        first practice session.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickFormatter={(d: string) => d.slice(5)} // MM-DD
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          width={30}
        />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "accuracyPct" ? [`${value}%`, "Accuracy"] : [value, "Attempts"]
          }
          labelStyle={{ color: "#374151" }}
        />
        <Line
          type="monotone"
          dataKey="accuracyPct"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
