"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";
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

export default function OrderDetailView({ order }: { order: Order }) {
  const isProcessed = order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered';
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
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payment</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-white">PhonePe</span>
            <PaymentBadge status={order.paymentStatus} />
          </div>
        </div>
      </div>

      {/* Shipment Tracking Timeline */}
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

        {/* Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting Line Track */}
          <div className="hidden md:block absolute top-4 left-[12.5%] right-[12.5%] h-[2px] bg-border/40 -translate-y-1/2 z-0" />
          {/* Active Progress Line */}
          <div 
            className="hidden md:block absolute top-4 left-[12.5%] h-[2px] bg-[#c9a35c] -translate-y-1/2 z-0 transition-all duration-700 ease-out" 
            style={{ width: lineWidth }}
          />

          {/* Step 1: Placed */}
          <div className="flex gap-3 md:flex-col md:items-center md:text-center relative">
            <div className="relative z-10 flex items-center justify-center size-8 rounded-full border border-[#c9a35c] bg-[#1a150e] text-[#c9a35c]">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Order Placed</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Payment Confirmed</p>
            </div>
          </div>

          {/* Step 2: Processing */}
          <div className="flex gap-3 md:flex-col md:items-center md:text-center relative">
            <div className={`relative z-10 flex items-center justify-center size-8 rounded-full border ${
              order.fulfillmentStatus === 'unfulfilled' 
                ? 'border-[#c9a35c] bg-[#1a150e] text-[#c9a35c] animate-pulse' 
                : 'border-[#c9a35c] bg-[#1a150e] text-[#c9a35c]'
            }`}>
              {order.fulfillmentStatus === 'unfulfilled' ? <Clock className="size-4" /> : <CheckCircle2 className="size-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Processing</p>
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
              <p className="text-[11px] text-muted-foreground mt-0.5">Dispatched via {order.carrier || "DTDC"}</p>
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

      <div className="space-y-4">
        {order.items.map((item) => {
          const image = item.variant.imageUrls?.[0] || item.variant.product.defaultImageUrls?.[0];
          return (
            <div key={item.id} className="flex gap-4 border border-border p-4">
              <div className="relative size-20 shrink-0 overflow-hidden bg-muted/20">
                {image ? (
                  <Image src={image} alt={item.variant.product.name} fill className="object-cover" sizes="80px" />
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
