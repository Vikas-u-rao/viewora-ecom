"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { DollarSign, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
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

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [dateRange, setDateRange] = useState("last-30");
  const [searchQuery, setSearchQuery] = useState("");

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
  } = useDashboardData(accessToken);

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExport={() => {}}
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
        </div>

        {fetchLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Sales"
                value={`₹${totalSales.toLocaleString("en-IN")}`}
                trend="+14.2%"
                isPositive={true}
                trendLabel="vs last month"
                icon={<DollarSign className="size-4.5" />}
              />
              <StatCard
                title="Total Orders"
                value={totalOrders.toString()}
                trend="+8.1%"
                isPositive={true}
                trendLabel="vs last month"
                icon={<ShoppingCart className="size-4.5" />}
              />
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
    </>
  );
}
