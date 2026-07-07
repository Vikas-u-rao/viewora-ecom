"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AccountLayout from "@/components/AccountLayout";
import OrderDetailView from "@/components/OrderDetailView";
import { useAuth } from "@/context/AuthContext";
import { fetchOrderApi, Order } from "@/services/orders";

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !id) return;
    fetchOrderApi(id, accessToken)
      .then((data) => setOrder(data.order))
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  return (
    <AccountLayout title="Order Details">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-gold" /></div>
      ) : order ? (
        <OrderDetailView order={order} />
      ) : (
        <div className="border border-dashed border-border py-16 text-center text-muted-foreground">Order not found.</div>
      )}
    </AccountLayout>
  );
}
