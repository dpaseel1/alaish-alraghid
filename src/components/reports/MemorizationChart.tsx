"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function MemorizationChart({
  data,
  barName,
  color = "#0f766e",
}: {
  data: { name: string; value: number }[];
  barName: string;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        لا توجد بيانات كافية لعرض الرسم البياني
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 13, direction: "rtl" }}
          formatter={(value) => [value, barName] as [number, string]}
        />
        <Bar dataKey="value" name={barName} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
