"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { IndianRupee, ShoppingCart, Users, Activity, X } from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData, Order } from "@/components/dashboard/useDashboardData";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { AverageSalesChart } from "@/components/dashboard/AverageSalesChart";
import { ChannelPerformanceCard } from "@/components/dashboard/ChannelPerformanceCard";
import { RevenueTargetComparison } from "@/components/dashboard/RevenueTargetComparison";
import { VisitorHeatmap } from "@/components/dashboard/VisitorHeatmap";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { TotalVisitorCard } from "@/components/dashboard/TotalVisitorCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { getApiBaseUrl } from "@/lib/constants";

interface AdminActivityLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [dateRange, setDateRange] = useState("last-30");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

  // Drill-down Modal State
  const [drillModal, setDrillModal] = useState<"sales" | "orders" | null>(null);

  const apiUrl = getApiBaseUrl();

  const {
    orders,
    totalSales,
    totalOrders,
    uniqueCustomers,
    topProducts,
    visitorCount,
    revenueTargetPercent,
    heatmapData,
    fetchLoading,
  } = useDashboardData(accessToken, searchQuery, dateRange);

  useEffect(() => {
    if (!accessToken) return;
    const fetchActivityLogs = async () => {
      try {
        const res = await fetch(`${apiUrl}/admin/activity`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data.logs || []);
        }
      } catch {
        // Silently catch
      }
    };
    fetchActivityLogs();
  }, [accessToken, apiUrl, activeTab]);

  const handleExportXlsx = () => {
    const summaryData = [
      { Metric: "Date Range Active", Value: dateRange },
      { Metric: "Total Sales", Value: `₹${totalSales.toLocaleString("en-IN")}` },
      { Metric: "Total Orders", Value: totalOrders },
      { Metric: "Total Unique Customers", Value: uniqueCustomers },
      { Metric: "Total Visitors", Value: visitorCount },
    ];

    const ordersData = orders.map((o) => ({
      "Order ID": o.id,
      Date: new Date(o.createdAt).toLocaleDateString("en-IN"),
      Customer: o.shippingName || o.user?.name || "Guest",
      Email: o.guestEmail || o.user?.email || "N/A",
      "Payment Status": o.paymentStatus,
      Fulfillment: o.fulfillmentStatus,
      "Amount (₹)": parseFloat(o.finalPayableAmount || "0"),
    }));

    const topProductsData = topProducts.map((tp) => ({
      "Product Name": tp.name,
      "Units Sold": tp.qty,
    }));

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
    const topProductsSheet = XLSX.utils.json_to_sheet(topProductsData);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, ordersSheet, "Orders Breakdown");
    XLSX.utils.book_append_sheet(workbook, topProductsSheet, "Top Products");

    XLSX.writeFile(workbook, `Viewora_Dashboard_Report_${dateRange}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExport={handleExportXlsx}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Sales & Analytics Dashboard
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Real-time operational summary & business metrics
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "activity"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Activity className="size-3.5" />
              Activity Log ({activityLogs.length})
            </button>
          </div>
        </div>

        {fetchLoading ? (
          <DashboardSkeleton />
        ) : activeTab === "activity" ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Admin Audit Activity Log</h3>
                <p className="text-xs text-gray-500">Chronological history of admin logins and stock modifications</p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {activityLogs.length} total entries
              </span>
            </div>

            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">No activity logs recorded yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activityLogs.map((log) => (
                  <div key={log.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{log.adminEmail}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">{log.details || "No extra details"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-gray-500 block">
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </span>
                      {log.ip && <span className="text-[10px] font-mono text-gray-400">IP: {log.ip}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="cursor-pointer" onClick={() => setDrillModal("sales")}>
                <StatCard
                  title="Total Sales"
                  value={`₹${totalSales.toLocaleString("en-IN")}`}
                  trend="+14.2%"
                  isPositive={true}
                  trendLabel="vs last month (Click for breakdown)"
                  icon={<IndianRupee className="size-4.5" />}
                />
              </div>
              <div className="cursor-pointer" onClick={() => setDrillModal("orders")}>
                <StatCard
                  title="Total Orders"
                  value={totalOrders.toString()}
                  trend="+8.1%"
                  isPositive={true}
                  trendLabel="vs last month (Click to view list)"
                  icon={<ShoppingCart className="size-4.5" />}
                />
              </div>
              <StatCard
                title="Total Customers"
                value={uniqueCustomers.toString()}
                trend="+19.4%"
                isPositive={true}
                trendLabel="vs last month"
                icon={<Users className="size-4.5" />}
              />
              <TotalVisitorCard totalVisitors={visitorCount} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-6">
              <AverageSalesChart />
              <ChannelPerformanceCard percentage={revenueTargetPercent} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueTargetComparison />
              <TopProductsChart products={topProducts} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <VisitorHeatmap data={heatmapData} />
              </div>
              <div className="lg:col-span-2">
                <RecentActivityCard orders={orders} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Drill-down Modal */}
      {drillModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900">
                {drillModal === "sales" ? "Detailed Sales Breakdown" : "Orders List Breakdown"}
              </h3>
              <button
                onClick={() => setDrillModal(null)}
                className="p-1 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {orders.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center">No transactions for the active date range.</p>
              ) : (
                orders.map((o: Order) => (
                  <div key={o.id} className="py-3 flex items-center justify-between text-xs gap-4">
                    <div>
                      <p className="font-mono font-bold text-gray-900">{o.id}</p>
                      <p className="text-gray-500">{o.shippingName || o.guestEmail || "Guest User"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.paymentStatus}
                      </span>
                    </div>
                    <div className="text-right font-bold text-gray-900">
                      ₹{parseFloat(o.finalPayableAmount || "0").toLocaleString("en-IN")}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setDrillModal(null)}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
