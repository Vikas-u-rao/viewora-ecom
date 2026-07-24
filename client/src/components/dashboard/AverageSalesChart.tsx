"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const data = [
  { day: "Mon", value: 42000 },
  { day: "Tue", value: 55000 },
  { day: "Wed", value: 48000 },
  { day: "Thu", value: 72000 },
  { day: "Fri", value: 61000 },
  { day: "Sat", value: 98000 },
  { day: "Sun", value: 85000 },
];

export function AverageSalesChart() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Average Sales Trend</h3>
          <p className="text-[11px] text-gray-500">
            Daily store transaction volume analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-gray-900 inline-block" />
          <span className="text-xs font-semibold text-gray-600">
            Daily Average (INR)
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
              }}
              formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Sales"]}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#111827"
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ r: 0 }}
              activeDot={{ r: 6, fill: "#111827", stroke: "#fff", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
