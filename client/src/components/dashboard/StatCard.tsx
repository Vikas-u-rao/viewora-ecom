import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function StatCard({
  title,
  value,
  trend,
  isPositive,
  trendLabel,
  icon,
}: {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  trendLabel: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">
          {title}
        </span>
        <div className="size-9 rounded-xl bg-gray-900/5 text-gray-950 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-2xl font-bold text-gray-950">{value}</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isPositive
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}{" "}
            {trend}
          </span>
          <span className="text-gray-500">{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}
