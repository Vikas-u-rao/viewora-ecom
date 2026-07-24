"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 185000, target: 200000 },
  { month: "Feb", revenue: 220000, target: 200000 },
  { month: "Mar", revenue: 195000, target: 220000 },
  { month: "Apr", revenue: 265000, target: 250000 },
  { month: "May", revenue: 240000, target: 250000 },
  { month: "Jun", revenue: 310000, target: 280000 },
];

export function RevenueTargetComparison() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            Revenue vs Target
          </h3>
          <p className="text-[11px] text-gray-500">
            Monthly comparison across current fiscal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-gray-900 inline-block" />
            <span className="text-[10px] font-semibold text-gray-500">
              Revenue
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-gray-300 inline-block" />
            <span className="text-[10px] font-semibold text-gray-500">
              Target
            </span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
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
              formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar
              dataKey="revenue"
              fill="#111827"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="target"
              fill="#d1d5db"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
