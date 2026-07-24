"use client";

import { LogOut } from "lucide-react";

export function UserProfile({
  name,
  email,
  onLogout,
}: {
  name?: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 mb-2">
        <div className="size-9 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm font-bold uppercase">
          {name ? name[0] : "A"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
            {name || "Administrator"}
          </p>
          <p className="text-[10px] text-gray-500 truncate leading-none mt-0.5">{email}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
      >
        <LogOut className="size-3.5" /> Sign Out
      </button>
    </div>
  );
}
