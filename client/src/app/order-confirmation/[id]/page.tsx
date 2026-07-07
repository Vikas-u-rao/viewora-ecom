"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/header";
import OrderDetailView from "@/components/OrderDetailView";
import { useAuth } from "@/context/AuthContext";
import { fetchOrderApi, Order } from "@/services/orders";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestOrder, setIsGuestOrder] = useState(false);
  const [estimatedDelivery] = useState(() =>
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
  );

  useEffect(() => {
    if (!id) return;
    setIsGuestOrder(typeof window !== "undefined" && localStorage.getItem(`viewora_guest_order_${id}`) === "1");
    fetchOrderApi(id, accessToken)
      .then((data) => setOrder(data.order))
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[1100px] px-6 lg:px-8 pt-28 pb-16">
        <div className="mb-8 text-center">
          <CheckCircle className="mx-auto mb-4 size-12 text-gold" />
          <h1 className="font-serif text-4xl text-white mb-2">Order placed successfully</h1>
          {order && <p className="text-muted-foreground">Order ID: <span className="text-gold">{order.id}</span></p>}
          <p className="mt-2 text-sm text-muted-foreground">Estimated delivery: {estimatedDelivery}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-gold" /></div>
        ) : order ? (
          <OrderDetailView order={order} />
        ) : (
          <div className="border border-dashed border-border py-16 text-center text-muted-foreground">Order not found.</div>
        )}

        {(isGuestOrder || (!user && order?.guestEmail)) && (
          <div className="mt-8 border border-gold/40 bg-gold/10 p-5 text-center">
            <p className="text-sm text-white mb-4">Register to track future orders and manage addresses faster.</p>
            <Link href="/register" className="inline-flex bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background">REGISTER</Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/shop" className="inline-flex border border-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-gold hover:bg-gold hover:text-background">
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    </div>
  );
}
