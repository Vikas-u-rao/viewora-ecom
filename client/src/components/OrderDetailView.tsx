"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, Truck, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Order } from "@/services/orders";

function money(value: string | number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
}

function PaymentBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    paid: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    refunded: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  const cls = colorMap[status] || "bg-muted/20 text-muted-foreground border-border";
  return (
    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${cls}`}>
      {status}
    </span>
  );
}

export default function OrderDetailView({
  order,
  onRetryPayment,
  isPaying = false,
  onCancelOrder,
  isCancelling = false,
}: {
  order: Order;
  onRetryPayment?: () => void;
  isPaying?: boolean;
  onCancelOrder?: () => void;
  isCancelling?: boolean;
}) {
  const isShipped = order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered';
  const isDelivered = order.fulfillmentStatus === 'delivered';

  const [lineWidth, setLineWidth] = useState("0%");

  useEffect(() => {
    const targetWidth = order.fulfillmentStatus === 'delivered'
      ? '75%'
      : order.fulfillmentStatus === 'shipped'
      ? '50%'
      : '25%';
    
    const timer = setTimeout(() => {
      setLineWidth(targetWidth);
    }, 150);

    return () => clearTimeout(timer);
  }, [order.fulfillmentStatus]);

  const handleContainerClick = () => {
    setLineWidth("0%");
    setTimeout(() => {
      const targetWidth = order.fulfillmentStatus === 'delivered'
        ? '75%'
        : order.fulfillmentStatus === 'shipped'
        ? '50%'
        : '25%';
      setLineWidth(targetWidth);
    }, 75);
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order ID</p>
          <p className="mt-2 font-medium text-white font-mono text-sm">{order.id.slice(0, 16).toUpperCase()}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fulfillment</p>
          <p className="mt-2 capitalize text-white">{order.fulfillmentStatus.replace("_", " ")}</p>
        </div>
        <div className="border border-border p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payment</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white capitalize">{order.payment?.provider === 'razorpay' ? 'Razorpay' : 'PhonePe'}</span>
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </div>
          {(order.paymentStatus === 'pending' || order.paymentStatus === 'failed') && order.fulfillmentStatus !== 'cancelled' && (
            <div className="mt-3 flex flex-col gap-2">
              {onRetryPayment && (
                <button
                  onClick={onRetryPayment}
                  disabled={isPaying || isCancelling}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-gold text-background px-4 py-2 text-xs font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors uppercase disabled:opacity-50"
                >
                  {isPaying ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  <span>{isPaying ? 'Processing…' : 'Pay Now'}</span>
                </button>
              )}
              {onCancelOrder && (
                <button
                  onClick={onCancelOrder}
                  disabled={isPaying || isCancelling}
                  className="w-full inline-flex items-center justify-center gap-1.5 border border-destructive/40 text-destructive hover:bg-destructive/10 px-4 py-1.5 text-[11px] font-semibold tracking-wider transition-colors uppercase disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 className="size-3 animate-spin" /> : null}
                  <span>{isCancelling ? 'Cancelling…' : 'Cancel Order'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {order.fulfillmentStatus === 'cancelled' ? (
        <div className="border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-semibold text-destructive uppercase tracking-wider mb-1">Order Cancelled</p>
          <p className="text-xs text-muted-foreground">This order has been cancelled and any reserved items have been released back to stock.</p>
        </div>
      ) : (
        <div 
          onClick={handleContainerClick} 
          className="border border-border p-6 bg-black/40 cursor-pointer select-none group"
          title="Click to replay status animation"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="font-serif text-xl text-white">Shipment Tracking</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Carrier: <span className="text-white font-medium">{order.carrier || "DTDC Express"}</span> &middot; Tracking ID: <span className="font-mono text-white select-all">{order.trackingNumber || `DT-${order.id.slice(0, 8).toUpperCase()}`}</span>
              </p>
            </div>
            <a
              href="https://www.dtdc.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[#c9a35c] text-[#c9a35c] hover:bg-[#c9a35c] hover:text-background px-4 py-2 text-xs font-bold tracking-[0.15em] transition-colors duration-300 rounded-sm"
            >
              TRACK SHIPMENT
            </a>
          </div>

          <div className="relative">
            {/* Background line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border hidden md:block" />
            {/* Animated progress line */}
            <div 
              className="absolute top-4 left-4 h-0.5 bg-[#c9a35c] transition-all duration-700 ease-out hidden md:block" 
              style={{ width: lineWidth }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-0">
              {/* Step 1: Order Placed */}
              <div className="flex gap-3 md:flex-col md:items-center md:text-center relative">
                <div className="relative z-10 flex items-center justify-center size-8 rounded-full border border-[#c9a35c] bg-[#1a150e] text-[#c9a35c]">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Order Placed</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{order.paymentStatus === 'paid' ? 'Payment Confirmed' : 'Order Created'}</p>
                </div>
              </div>

              {/* Step 2: Processing */}
              <div className="flex gap-3 md:flex-col md:items-center md:text-center relative">
                <div className={`relative z-10 flex items-center justify-center size-8 rounded-full border ${
                  order.fulfillmentStatus === 'processing' || isShipped
                    ? 'border-[#c9a35c] bg-[#1a150e] text-[#c9a35c]'
                    : 'border-border bg-[#0a0a0a] text-muted-foreground'
                }`}>
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${order.fulfillmentStatus === 'processing' || isShipped ? 'text-white' : 'text-muted-foreground'}`}>Processing</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Quality check & packed</p>
                </div>
              </div>

              {/* Step 3: Shipped */}
              <div className="flex gap-3 md:flex-col md:items-center md:text-center relative">
                <div className={`relative z-10 flex items-center justify-center size-8 rounded-full border ${
                  isShipped
                    ? 'border-[#c9a35c] bg-[#1a150e] text-[#c9a35c]'
                    : 'border-border bg-[#0a0a0a] text-muted-foreground'
                }`}>
                  <Truck className="size-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isShipped ? 'text-white' : 'text-muted-foreground'}`}>Shipped</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Dispatched via DTDC</p>
                </div>
              </div>

              {/* Step 4: Delivered */}
              <div className="flex gap-3 md:flex-col md:items-center md:text-center relative">
                <div className={`relative z-10 flex items-center justify-center size-8 rounded-full border ${
                  isDelivered
                    ? 'border-[#c9a35c] bg-[#1a150e] text-[#c9a35c]'
                    : 'border-border bg-[#0a0a0a] text-muted-foreground'
                }`}>
                  <Package className="size-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDelivered ? 'text-white' : 'text-muted-foreground'}`}>Delivered</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Handed to customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {order.items.map((item) => {
          const image = item.variant.imageUrls?.[0] || item.variant.product.defaultImageUrls?.[0];
          return (
            <div key={item.id} className="flex gap-4 border border-border p-4">
              <div className="relative size-20 shrink-0 overflow-hidden bg-muted/20">
                {image ? (
                  <Image src={image} alt={item.variant.product.name} fill unoptimized className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Package className="size-10 text-muted-foreground" strokeWidth={1.2} /></div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <h2 className="font-medium text-white">{item.variant.product.name}</h2>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity} · {item.variant.color || item.skuSnapshot}</p>
                </div>
                <p className="text-gold tabular-nums">{money(Number(item.priceAtPurchase) * item.quantity)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border border-border p-5">
          <h2 className="font-serif text-xl text-white mb-3">Shipping Address</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {order.shippingName}<br />
            {order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}<br />
            {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
          </p>
        </div>
        <div className="border border-border p-5">
          <h2 className="font-serif text-xl text-white mb-4">Price Breakdown</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{money(order.shippingFee)}</span></div>
            <div className="flex justify-between border-t border-border pt-3 text-lg text-white"><span>Total</span><span className="text-gold">{money(order.finalPayableAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
