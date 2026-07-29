"use client";

import Link from "next/link";
import { Search, Download, Calendar, ExternalLink } from "lucide-react";
import { AdminNotificationsDropdown } from "@/components/admin/AdminNotificationsDropdown";
import { useAuth } from "@/context/AuthContext";
import { FilterDropdown } from "./FilterDropdown";

export function Header({
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  onExport,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  onExport: () => void;
}) {
  const { accessToken } = useAuth();
  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 px-8 flex items-center justify-between z-20">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search dashboard & analytics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">

        <FilterDropdown
          value={dateRange}
          onChange={setDateRange}
          options={[
            { label: "Last 7 Days", value: "last-7" },
            { label: "Last 30 Days", value: "last-30" },
            { label: "Last 90 Days", value: "last-90" },
            { label: "Year to Date", value: "year-to-date" },
          ]}
          icon={<Calendar className="size-3.5 text-gray-400" />}
        />

        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <Download className="size-3.5" /> Export
        </button>

        <AdminNotificationsDropdown accessToken={accessToken} />

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 px-4.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Storefront <ExternalLink className="size-3" />
        </Link>
      </div>
    </header>
  );
}
