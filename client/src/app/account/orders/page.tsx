"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import AccountLayout from "@/components/AccountLayout";
import { useAuth } from "@/context/AuthContext";
import { fetchOrdersApi, Order } from "@/services/orders";

function money(value: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
}

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetchOrdersApi(accessToken)
      .then((data) => setOrders(data.orders))
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <AccountLayout title="Orders">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-gold" /></div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 size-8" />
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="py-3">Order ID</th>
                <th className="py-3">Order Date</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/70">
                  <td className="py-4">
                    <Link href={`/account/orders/${order.id}`} className="font-medium text-gold hover:underline">
                      {order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="py-4 capitalize">{order.fulfillmentStatus.replace("_", " ")}</td>
                  <td className="py-4 text-right tabular-nums">{money(order.finalPayableAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountLayout>
  );
}
