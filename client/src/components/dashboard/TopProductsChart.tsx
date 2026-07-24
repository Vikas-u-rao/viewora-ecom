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

export function TopProductsChart({
  products,
}: {
  products: { name: string; qty: number }[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-sm font-bold text-gray-800">
          Top 3 Selling Products
        </h3>
        <p className="text-[11px] text-gray-500">
          Based on recent sales conversions
        </p>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={products}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={120}
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
              formatter={(val: number) => [`${val} units`, "Sold"]}
            />
            <Bar
              dataKey="qty"
              fill="#111827"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {products.map((p, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                {p.name}
              </span>
              <span className="font-bold text-gray-950">{p.qty} sold</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(100, (p.qty / 50) * 100)}%`,
                }}
                className="bg-gray-900 h-full rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
