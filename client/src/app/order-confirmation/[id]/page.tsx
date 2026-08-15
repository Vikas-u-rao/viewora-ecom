"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/header";
import OrderDetailView from "@/components/OrderDetailView";
import { useAuth } from "@/context/AuthContext";
import { fetchOrderApi, Order } from "@/services/orders";
import { COUPON_STORAGE_KEY } from "@/services/coupons";

function PaymentStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    refunded: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const cls = colorMap[status] || "bg-muted/20 text-muted-foreground border-border";
  return (
    <span className={`inline-block px-3 py-1 text-xs font-bold tracking-wider uppercase border ${cls}`}>
      {status}
    </span>
  );
}

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [estimatedDelivery] = useState(() =>
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
  );

  // Clear any applied coupon once order confirmation is reached
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!id || authLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchOrderApi(id, accessToken)
      .then((data) => {
        setOrder(data.order);
        setFetchError(null);
      })
      .catch((error: Error) => {
        setFetchError(error.message);
      })
      .finally(() => setLoading(false));
  }, [accessToken, authLoading, id]);

  // Guard: redirect only if loading done, no order, and no error
  useEffect(() => {
    if (!loading && !authLoading && !order && !fetchError) {
      router.replace("/");
    }
  }, [loading, authLoading, order, fetchError, router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[1100px] px-6 pt-28 pb-16">
        <div className="mb-10 text-center">
          <CheckCircle className="mx-auto mb-6 size-16 text-gold" strokeWidth={1.2} />
          <h1 className="font-serif text-4xl text-white mb-2">Order placed successfully</h1>
          {order && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <p className="text-muted-foreground">Order ID: <span className="text-gold font-mono">{order.id.slice(0, 12).toUpperCase()}</span></p>
              <span className="text-muted-foreground/40">|</span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          )}
          <p className="mt-3 text-sm text-muted-foreground">Estimated delivery: {estimatedDelivery}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-gold" /></div>
        ) : order ? (
          <>
            {/* Earned Coupon Banner */}
            {order.earnedCoupon && (
              <div className="mb-8 border border-gold/30 bg-gold/5 p-6 text-center rounded-sm max-w-[600px] mx-auto">
                <span className="text-xs uppercase tracking-[0.2em] text-gold font-bold mb-1 block">Special Reward Earned</span>
                <h3 className="font-serif text-2xl text-white mb-2">You earned a 10% Discount Coupon!</h3>
                <p className="text-sm text-muted-foreground mb-4">Since your order subtotal was ₹5,000 or more, here is a discount coupon for your next purchase:</p>
                <div className="inline-flex items-center gap-3 bg-background border border-gold/40 px-6 py-2.5 rounded-sm">
                  <span className="font-mono text-lg font-bold tracking-wider text-gold select-all">{order.earnedCoupon.code}</span>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-3">Valid for 90 days (Value: 10% of subtotal). Keep this code safe!</p>
              </div>
            )}

            <OrderDetailView order={order} />

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/account/orders"
                className="inline-flex border border-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-gold hover:bg-gold hover:text-background transition-colors"
              >
                VIEW ORDERS
              </Link>
              <Link
                href="/shop"
                className="inline-flex bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background hover:bg-gold-soft transition-colors"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground mb-2">Order not found.</p>
            <p className="text-xs text-muted-foreground/60">{fetchError}</p>
            <Link href="/shop" className="inline-block mt-6 border border-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-gold hover:bg-gold hover:text-background transition-colors">
              CONTINUE SHOPPING
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
