export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-white border border-gray-200 rounded-2xl"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-6">
        <div className="h-80 bg-white border border-gray-200 rounded-2xl" />
        <div className="h-80 bg-white border border-gray-200 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-64 bg-white border border-gray-200 rounded-2xl" />
        <div className="h-64 bg-white border border-gray-200 rounded-2xl" />
        <div className="h-64 bg-white border border-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}
