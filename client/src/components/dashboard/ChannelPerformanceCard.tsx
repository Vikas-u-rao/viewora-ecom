export function ChannelPerformanceCard({
  percentage,
}: {
  percentage: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-gray-800">Channel Performance</h3>
        <p className="text-[11px] text-gray-500">
          Visitor counts by referral channel
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative size-44">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#f1f5f9"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="125 250"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#111827"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${(percentage / 100) * 125} 250`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <span className="text-3xl font-bold text-gray-900">
              {percentage}%
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
              Target Reached
            </span>
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-2 text-center mt-4">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Organic
            </span>
            <p className="text-sm font-semibold text-gray-800">55%</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Social
            </span>
            <p className="text-sm font-semibold text-gray-800">28%</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              Direct
            </span>
            <p className="text-sm font-semibold text-gray-800">17%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
