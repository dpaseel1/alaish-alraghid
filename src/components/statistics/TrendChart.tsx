"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function TrendChart({
  data,
  lineName,
  color = "#0f766e",
  valueSuffix = "",
}: {
  data: { label: string; value: number }[];
  lineName: string;
  color?: string;
  valueSuffix?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 text-sm">
        لا توجد بيانات كافية لعرض الرسم البياني
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 13, direction: "rtl" }}
          formatter={(value) => [`${value}${valueSuffix}`, lineName] as [string, string]}
        />
        <Line
          type="monotone"
          dataKey="value"
          name={lineName}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
