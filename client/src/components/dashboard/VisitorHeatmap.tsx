"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  "00:00 - 04:00",
  "04:00 - 08:00",
  "08:00 - 12:00",
  "12:00 - 16:00",
  "16:00 - 20:00",
  "20:00 - 24:00",
];

const DEFAULT_HEATMAP: number[][] = [
  [14, 18, 12, 15, 32, 45, 28],
  [8, 12, 20, 18, 28, 38, 22],
  [25, 32, 40, 48, 62, 75, 42],
  [30, 42, 55, 60, 78, 88, 58],
  [45, 58, 68, 72, 94, 98, 76],
  [22, 35, 42, 45, 68, 82, 48],
];

export function VisitorHeatmap({ data }: { data?: number[][] }) {
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    time: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const gridData = data && data.length === 6 ? data : DEFAULT_HEATMAP;

  const getHeatmapStyle = (val: number) => {
    if (val < 20) return "bg-amber-100/70 text-amber-900 border-amber-200/60";
    if (val < 45) return "bg-amber-300 text-amber-950 border-amber-400/60 font-semibold";
    if (val < 75) return "bg-amber-500 text-white border-amber-600/60 font-bold shadow-xs";
    return "bg-[#b48738] text-white border-[#8c6523] font-extrabold shadow-sm";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5 relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            Hourly Visitor Heatmap
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Weekly traffic concentration levels by time slot
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          Live Traffic Pattern
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          {/* Days Header */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left pl-1">
              Time
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-bold text-gray-600 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap Grid Rows */}
          <div className="space-y-2">
            {TIME_SLOTS.map((timeLabel, rowIndex) => (
              <div
                key={timeLabel}
                className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 items-center"
              >
                <div className="text-[10px] font-bold text-gray-500 text-left pl-1">
                  {timeLabel}
                </div>

                {DAYS.map((dayLabel, colIndex) => {
                  const val = gridData[rowIndex]?.[colIndex] ?? 15;
                  const styleClass = getHeatmapStyle(val);

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          day: dayLabel,
                          time: timeLabel,
                          value: val,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-9 rounded-lg border text-[11px] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 ${styleClass}`}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-xl border border-gray-700 whitespace-nowrap animate-fade-in"
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <div className="font-bold text-amber-300">
            {hoveredCell.day} ({hoveredCell.time})
          </div>
          <div className="text-[11px] text-gray-200">
            👥 <strong>{hoveredCell.value}</strong> Active Visitors
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-3 border-t border-gray-100 gap-2">
        <span className="font-medium">Traffic Intensity:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-100 border border-amber-200" />
            <span>0-20 (Low)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-300 border border-amber-400" />
            <span>21-45 (Moderate)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-500 border border-amber-600" />
            <span>46-75 (High)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-[#b48738] border border-[#8c6523]" />
            <span>76+ (Peak)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
