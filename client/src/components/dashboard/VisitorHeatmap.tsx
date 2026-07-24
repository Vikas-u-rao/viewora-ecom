export function VisitorHeatmap({ data }: { data: number[][] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">
          Hourly Visitor Heatmap
        </h3>
        <p className="text-[11px] text-gray-500">
          Weekly traffic concentration levels
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-gray-400">
            {d}
          </div>
        ))}
        {data.flat().map((val, idx) => (
          <div
            key={idx}
            title={`${val} active visits`}
            style={{
              backgroundColor: `rgba(15, 23, 42, ${Math.min(1, val / 100)})`,
            }}
            className="aspect-square rounded-md cursor-pointer transition-transform hover:scale-110"
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[9px] text-gray-400 pt-2 border-t border-gray-100">
        <span>Less active</span>
        <div className="flex gap-1">
          <span className="size-2.5 rounded bg-gray-900/10" />
          <span className="size-2.5 rounded bg-gray-900/40" />
          <span className="size-2.5 rounded bg-gray-900/80" />
        </div>
        <span>Highly active</span>
      </div>
    </div>
  );
}
