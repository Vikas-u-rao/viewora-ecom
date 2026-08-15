"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AccountLayout from "@/components/AccountLayout";
import OrderDetailView from "@/components/OrderDetailView";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOrderApi,
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  Order,
} from "@/services/orders";

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    fetchOrderApi(id, accessToken)
      .then((data) => setOrder(data.order))
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  const handleRetryPayment = async () => {
    if (!order || !accessToken) return;
    setIsPaying(true);

    try {
      // Ensure Razorpay SDK is loaded
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise<boolean>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      }

      const razorpayOrder = await createRazorpayOrderApi(order.id, accessToken);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Viewora Luxury Eyewear",
        description: `Order #${order.id.slice(0, 8)}`,
        order_id: razorpayOrder.razorpayOrderId,
        prefill: {
          name: order.shippingName || user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#c5a059",
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            toast.loading("Verifying payment…", { id: "retry-pay" });
            await verifyRazorpayPaymentApi(
              {
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              accessToken
            );
            toast.dismiss("retry-pay");
            toast.success("Payment verified successfully!");
            router.push(`/order-confirmation/${order.id}`);
          } catch (err: any) {
            toast.dismiss("retry-pay");
            toast.error(err?.message || "Verification failed");
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            toast.info("Payment cancelled.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setIsPaying(false);
        toast.error(response?.error?.description || "Payment failed.");
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Failed to initiate payment");
      setIsPaying(false);
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!order || !accessToken) return;
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await cancelOrderApi(order.id, accessToken);
      toast.success("Order cancelled successfully");
      // Refresh order state
      const refreshed = await fetchOrderApi(order.id, accessToken);
      setOrder(refreshed.order);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AccountLayout title="Order Details">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-gold" /></div>
      ) : order ? (
        <OrderDetailView
          order={order}
          onRetryPayment={handleRetryPayment}
          isPaying={isPaying}
          onCancelOrder={handleCancelOrder}
          isCancelling={isCancelling}
        />
      ) : (
        <div className="border border-dashed border-border py-16 text-center text-muted-foreground">Order not found.</div>
      )}
    </AccountLayout>
  );
}
