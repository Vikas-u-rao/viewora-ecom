"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { ShoppingCart, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import type { Order } from "@/components/dashboard/useDashboardData";

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const { orders, fetchLoading, ordersPage, ordersTotalPages, setOrdersPage } =
    useDashboardData(accessToken);

  const [searchQuery, setSearchQuery] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.shippingName && o.shippingName.toLowerCase().includes(q)) ||
      (o.guestEmail && o.guestEmail.toLowerCase().includes(q)) ||
      (o.user && o.user.email.toLowerCase().includes(q));
    const matchesFulfillment =
      fulfillmentFilter === "all" || o.fulfillmentStatus === fulfillmentFilter;
    return matchesSearch && matchesFulfillment;
  });

  const handleUpdateFulfillment = async (orderId: string, status: string) => {
    setActionLoading(orderId);
    try {
      await fetch(
        `${apiUrl}/admin/orders/${orderId}/fulfillment-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Store Customer Orders
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          View, manage, and fulfill customer orders
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter orders by ID, Name, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800 transition-colors"
            />
          </div>
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-3 py-2 rounded-xl outline-none focus:border-gray-900 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {fetchLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-150 rounded-xl space-y-2">
            <ShoppingCart className="size-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No Orders Found</h4>
            <p className="text-xs text-gray-400">No transactions matching the selected criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((o: Order) => (
              <div
                key={o.id}
                className="border border-gray-200 p-5 rounded-2xl bg-white flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Order ID
                    </p>
                    <p className="font-mono text-xs text-gray-900 font-bold">
                      {o.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Date
                    </p>
                    <p className="text-xs font-semibold text-gray-700">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Payment
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-md border ${
                        o.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : o.paymentStatus === "refunded"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Fulfillment
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-md border ${
                        o.fulfillmentStatus === "delivered"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : o.fulfillmentStatus === "cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {o.fulfillmentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 text-xs">
                  <div className="space-y-1.5">
                    <h4 className="text-gray-800 font-bold uppercase tracking-wider text-[10px]">
                      Customer
                    </h4>
                    <p className="text-gray-900 font-bold">
                      {o.shippingName || "Guest User"}
                    </p>
                    <p className="text-gray-500 font-medium">
                      {o.guestEmail || o.user?.email || "No Email"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-gray-800 font-bold uppercase tracking-wider text-[10px]">
                      Products
                    </h4>
                    <ul className="divide-y divide-gray-100 space-y-1.5">
                      {o.items.map((i) => (
                        <li key={i.id} className="pt-1.5 flex justify-between gap-4">
                          <span className="text-gray-600 font-medium">
                            {i.variant?.product?.name || "Eyewear Frame"} (
                            {i.skuSnapshot}){" "}
                            <strong className="text-gray-900">x{i.quantity}</strong>
                          </span>
                          <span className="text-gray-900 font-bold">
                            ₹{Number(i.priceAtPurchase).toLocaleString("en-IN")}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-2 border-t border-gray-150 flex justify-between text-gray-900 font-bold">
                      <span>Total:</span>
                      <span className="text-sm">
                        ₹{Number(o.finalPayableAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Fulfillment:
                    </span>
                    <select
                      value={o.fulfillmentStatus}
                      disabled={actionLoading === o.id}
                      onChange={(e) =>
                        handleUpdateFulfillment(o.id, e.target.value)
                      }
                      className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-3 py-1.5 rounded-lg outline-none focus:border-gray-900 cursor-pointer"
                    >
                      <option value="unfulfilled">Unfulfilled</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {ordersTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
              disabled={ordersPage === 1}
              className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              PREVIOUS
            </button>
            <span className="text-xs text-gray-500 font-semibold">
              Page <strong className="text-gray-900">{ordersPage}</strong> of{" "}
              {ordersTotalPages}
            </span>
            <button
              onClick={() =>
                setOrdersPage(Math.min(ordersTotalPages, ordersPage + 1))
              }
              disabled={ordersPage === ordersTotalPages}
              className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
