"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { Order } from "@/services/orders";

function money(value: string | number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
}

export default function OrderDetailView({ order }: { order: Order }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order ID</p>
          <p className="mt-2 font-medium text-white">{order.id}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order Status</p>
          <p className="mt-2 capitalize text-white">{order.fulfillmentStatus.replace("_", " ")}</p>
        </div>
        <div className="border border-border p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payment Method</p>
          <p className="mt-2 text-white">PhonePe</p>
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
                  <div className="flex h-full items-center justify-center"><Package className="size-7 text-muted-foreground" /></div>
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
