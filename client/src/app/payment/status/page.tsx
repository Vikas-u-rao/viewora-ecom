"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import Header from "@/components/header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getPaymentStatusApi } from "@/services/orders";

type StatusState = "loading" | "success" | "failed" | "pending";

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { refreshCart } = useCart();

  const orderId = searchParams.get("orderId");
  const initialStatusParam = searchParams.get("status");

  const [status, setStatus] = useState<StatusState>(() => {
    if (initialStatusParam === "cancelled" || initialStatusParam === "failed") {
      return "failed";
    }
    return "loading";
  });
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 10;

  const checkStatus = useCallback(async () => {
    if (!orderId) {
      setStatus("failed");
      return;
    }

    if (initialStatusParam === "cancelled" || initialStatusParam === "failed") {
      setStatus("failed");
      return;
    }

    try {
      const data = await getPaymentStatusApi(orderId, accessToken);

      if (data.paymentStatus === "paid" || data.status === "success") {
        setStatus("success");
        // Clear the cart since order is confirmed
        await refreshCart();
        // Redirect to order confirmation after a short delay
        setTimeout(() => {
          router.push(`/order-confirmation/${orderId}`);
        }, 2500);
      } else if (data.paymentStatus === "failed" || data.status === "failed") {
        setStatus("failed");
      } else {
        // Still pending — retry
        setStatus("pending");
      }
    } catch {
      setStatus("pending");
    }
  }, [orderId, initialStatusParam, accessToken, refreshCart, router]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Auto-retry while pending (up to maxAttempts, every 3 seconds)
  useEffect(() => {
    if (status !== "pending" || attempts >= maxAttempts) return;

    const timer = setTimeout(() => {
      setAttempts((prev) => prev + 1);
      checkStatus();
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, attempts, checkStatus, maxAttempts]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[600px] px-6 pt-36 pb-16 text-center">

        {(status === "loading" || status === "pending") && (
          <div className="space-y-6">
            <Loader2 className="mx-auto size-16 animate-spin text-gold" />
            <h1 className="font-serif text-3xl text-white">Verifying Payment…</h1>
            <p className="text-muted-foreground">
              {status === "pending" && attempts > 0
                ? `Still checking… (attempt ${attempts}/${maxAttempts})`
                : "Please wait while we confirm your payment with PhonePe."}
            </p>
            {status === "pending" && attempts >= maxAttempts && (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Taking longer than expected. Your payment may still be processing.
                </p>
                <button
                  onClick={() => { setAttempts(0); checkStatus(); }}
                  className="inline-flex items-center gap-2 border border-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-gold hover:bg-gold hover:text-background transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                  CHECK AGAIN
                </button>
              </div>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <CheckCircle className="mx-auto size-16 text-gold" />
            <h1 className="font-serif text-3xl text-white">Payment Successful!</h1>
            <p className="text-muted-foreground">Your order has been confirmed. Redirecting to your order details…</p>
            <Loader2 className="mx-auto size-5 animate-spin text-gold" />
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-6">
            <XCircle className="mx-auto size-16 text-destructive" />
            <h1 className="font-serif text-3xl text-white">Payment Incomplete</h1>
            <p className="text-muted-foreground">
              Your payment was cancelled or could not be completed. Your order reservation is held for 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              {orderId && (
                <Link
                  href={`/account/orders/${orderId}`}
                  className="bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background hover:bg-gold-soft transition-colors uppercase"
                >
                  VIEW ORDER DETAILS
                </Link>
              )}
              <Link
                href="/shop"
                className="border border-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-gold hover:bg-gold hover:text-background transition-colors uppercase"
              >
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        )}

        {!orderId && status === "failed" && (
          <div className="space-y-4">
            <XCircle className="mx-auto size-16 text-destructive" />
            <h1 className="font-serif text-3xl text-white">Invalid Payment Link</h1>
            <p className="text-muted-foreground">No order ID was found in this URL.</p>
            <Link href="/shop" className="inline-block bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background">
              GO TO SHOP
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-[600px] px-6 pt-36 pb-16 text-center">
          <Loader2 className="mx-auto size-16 animate-spin text-gold" />
          <p className="mt-6 text-muted-foreground">Loading payment status…</p>
        </main>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
