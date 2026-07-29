"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ShoppingBag, AlertTriangle, AlertOctagon, UserPlus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/constants";

export interface AdminNotification {
  id: string;
  type: "subscriber" | "low_stock" | "out_of_stock" | "order";
  title: string;
  message: string;
  timestamp: string;
  link: string;
}

export function AdminNotificationsDropdown({ accessToken }: { accessToken: string | null }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    if (!accessToken) return;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/admin/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch {
        // Silent catch
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [accessToken, apiUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="size-4 text-emerald-600" />;
      case "low_stock":
        return <AlertTriangle className="size-4 text-amber-600" />;
      case "out_of_stock":
        return <AlertOctagon className="size-4 text-red-600" />;
      case "subscriber":
        return <UserPlus className="size-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="View notifications"
      >
        <Bell className="size-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Live Feed</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="size-6 text-gray-300" />
                <span>All clear! No pending notifications.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setIsOpen(false)}
                  className="p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors block"
                >
                  <div className="p-2 bg-gray-100 rounded-xl shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed truncate">{n.message}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
