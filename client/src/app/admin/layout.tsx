"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "admin") {
        router.replace("/");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-10 animate-spin text-gray-800 mx-auto" />
          <p className="text-sm font-medium text-gray-600">
            Loading Premium Console...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-red-50 text-red-500">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Access Restricted
          </h1>
          <p className="text-gray-600 text-sm">
            This workspace requires administrative privileges.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex antialiased" style={{ fontFamily: "Arial, sans-serif" }}>
      <Sidebar
        user={user}
        onLogout={() => {
          logout();
          router.replace("/");
        }}
      />

      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}


