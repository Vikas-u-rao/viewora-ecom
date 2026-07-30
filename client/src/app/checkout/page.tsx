"use client";
export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, ShieldCheck, Truck, Check, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Address, AddressPayload, fetchAddressesApi, saveAddressApi } from "@/services/account";
import { createOrderApi, orderItemsFromCart, initiatePaymentApi } from "@/services/orders";
import { COUPON_STORAGE_KEY } from "@/services/coupons";
import { resolveImageUrl } from "@/lib/productImage";

const SHIPPING_FEE = 99;

const emptyAddress: AddressPayload = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressForm, setAddressForm] = useState<AddressPayload>({ ...emptyAddress });
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod] = useState<"phonepe">("phonepe");
  const [placing, setPlacing] = useState(false);

  const availableItems = items.filter((item) => !item.productUnavailable && item.variant);
  const unavailableItems = items.filter((item) => item.productUnavailable);
  const total = subtotal + (availableItems.length > 0 ? SHIPPING_FEE : 0);

  // Auth guard
  useEffect(() => {
    if (!user && !accessToken) {
      router.replace("/login");
    }
  }, [user, accessToken, router]);

  useEffect(() => {
    if (!accessToken) return;
    fetchAddressesApi(accessToken)
      .then((data) => {
        setAddresses(data);
        setSelectedAddressId(data.find((address) => address.isDefault)?.id || data[0]?.id || "");
        setShowNewAddress(data.length === 0);
      })
      .catch((error: Error) => toast.error(error.message));
  }, [accessToken]);

  const payloadAddress = {
    shippingName: addressForm.name.trim(),
    shippingLine1: addressForm.line1.trim(),
    shippingLine2: addressForm.line2?.trim() || undefined,
    shippingCity: addressForm.city.trim(),
    shippingState: addressForm.state.trim(),
    shippingPincode: addressForm.pincode.trim(),
  };

  const handlePlaceOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !accessToken) {
      toast.error("Please log in to place an order.");
      return;
    }
    if (availableItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (unavailableItems.length > 0) {
      toast.error("Remove unavailable items before checkout.");
      return;
    }
    if (showNewAddress && (!payloadAddress.shippingName || !payloadAddress.shippingLine1 || !payloadAddress.shippingCity || !payloadAddress.shippingState || !payloadAddress.shippingPincode)) {
      toast.error("Please complete the shipping address.");
      return;
    }

    setPlacing(true);
    try {
      let addressId = selectedAddressId;
      if (showNewAddress) {
        const saved = await saveAddressApi(accessToken, { ...addressForm, isDefault: addresses.length === 0 || addressForm.isDefault });
        addressId = saved.id;
      }

      const storedCoupon = typeof window !== 'undefined' ? localStorage.getItem(COUPON_STORAGE_KEY) : null;
      const parsedCoupon = storedCoupon ? JSON.parse(storedCoupon) : null;

      const { order } = await createOrderApi(
        {
          addressId,
          paymentMethod,
          items: orderItemsFromCart(items),
          ...(parsedCoupon ? { couponCode: parsedCoupon.code } : {}),
        },
        accessToken
      );

      localStorage.removeItem(COUPON_STORAGE_KEY);
      await clearCart();

      toast.loading("Redirecting to payment…", { id: "payment-redirect" });
      const { redirectUrl } = await initiatePaymentApi(order.id, accessToken);
      toast.dismiss("payment-redirect");
      window.location.href = redirectUrl;
    } catch (error) {
      toast.dismiss("payment-redirect");
      toast.error(error instanceof Error ? error.message : "Failed to place order.");
      setPlacing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex items-center justify-center px-6 pt-28 pb-16">
          <Loader2 className="size-8 animate-spin text-gold" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="mb-8 pb-4 border-b border-border/60">
          <h1 className="font-serif text-3xl sm:text-4xl text-white">Checkout</h1>
          <p className="text-xs text-muted-foreground mt-1">Review your order details and choose payment</p>
        </div>

        {items.length === 0 ? (
          <div className="border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Link href="/shop" className="bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background">CONTINUE SHOPPING</Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <section className="space-y-6">
              {/* Shipping Address Section */}
              <div className="border border-border bg-card/60 p-5 sm:p-6 rounded-none">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold font-mono">1</div>
                    <h2 className="font-serif text-xl sm:text-2xl text-white">Shipping Address</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewAddress((value) => !value)}
                    className="text-xs font-semibold text-gold hover:text-gold-soft transition-colors flex items-center gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>{showNewAddress ? "Select Saved Address" : "Add New Address"}</span>
                  </button>
                </div>

                {addresses.length > 0 && !showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((address) => {
                      const isSelected = selectedAddressId === address.id;
                      return (
                        <button
                          type="button"
                          key={address.id}
                          onClick={() => setSelectedAddressId(address.id)}
                          className={`border p-4 text-left transition-all relative ${
                            isSelected ? "border-gold bg-gold/10 shadow-[0_0_12px_rgba(197,160,89,0.15)]" : "border-border/70 hover:border-gold/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-white text-sm">{address.name}</span>
                            <div className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${isSelected ? "border-gold bg-gold" : "border-muted-foreground/40"}`}>
                              {isSelected && <Check className="size-3 text-black stroke-[3]" />}
                            </div>
                          </div>
                          <span className="mt-2 block text-xs leading-relaxed text-muted-foreground font-sans">
                            {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} - {address.pincode}
                          </span>
                          {address.phone && (
                            <span className="mt-1 block text-[11px] font-mono text-gold/80">Phone: {address.phone}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    {(["name", "phone", "line1", "line2", "city", "state", "pincode"] as const).map((field) => (
                      <input
                        key={field}
                        required={field !== "line2"}
                        placeholder={field === "line1" ? "Address line 1 *" : field === "line2" ? "Address line 2 (Optional)" : field === "phone" ? "Phone number *" : `${field[0].toUpperCase() + field.slice(1)} *`}
                        value={String(addressForm[field] || "")}
                        onChange={(event) => setAddressForm((prev) => ({ ...prev, [field]: event.target.value }))}
                        className="border border-border bg-input px-3.5 py-2.5 text-xs text-white placeholder:text-muted-foreground/60 outline-none focus:border-gold transition-colors font-sans"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method Section */}
              <div className="border border-border bg-card/60 p-5 sm:p-6 rounded-none">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold font-mono">2</div>
                  <h2 className="font-serif text-xl sm:text-2xl text-white">Payment Method</h2>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border border-gold bg-gold/10 relative transition-all shadow-[0_0_15px_rgba(197,160,89,0.12)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-gold flex items-center justify-center bg-gold">
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase font-sans">PhonePe Payment Gateway</span>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">Pay via UPI (GPay, PhonePe, Paytm), Cards & Netbanking</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold tracking-widest text-gold bg-gold/20 px-2 py-0.5 border border-gold/30 uppercase">RECOMMENDED</span>
                    </div>

                    {/* Sub Payment Options / Badges */}
                    <div className="mt-4 pt-3 border-t border-gold/20 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-sans">
                      <span className="px-2.5 py-1 bg-black/60 border border-gold/20 text-white rounded-none flex items-center gap-1.5">
                        <span className="text-gold font-bold">UPI</span> (GPay / PhonePe / Paytm / BHIM)
                      </span>
                      <span className="px-2.5 py-1 bg-black/60 border border-gold/20 text-white rounded-none flex items-center gap-1.5">
                        <CreditCard className="size-3 text-gold" /> Cards (Visa / Mastercard / RuPay)
                      </span>
                      <span className="px-2.5 py-1 bg-black/60 border border-gold/20 text-white rounded-none flex items-center gap-1.5">
                        Netbanking (50+ Banks)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Order Summary Sidebar */}
            <aside className="h-fit border border-border bg-card/80 p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl text-white mb-4 pb-3 border-b border-border/60">Order Summary</h2>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {availableItems.map((item) => {
                  const product = item.variant?.product;
                  const rawImg = item.variant?.imageUrls?.[0];
                  const imgSrc = resolveImageUrl(rawImg);
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-b-0">
                      <div className="relative w-12 h-12 bg-white/5 border border-border shrink-0 overflow-hidden">
                        {imgSrc && (
                          <Image
                            src={imgSrc}
                            alt={product?.name || "Product"}
                            fill
                            unoptimized
                            className="object-contain p-1"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-white truncate font-sans">{product?.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-sans">
                          {item.variant?.color || "Standard"} • Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-white tabular-nums shrink-0 font-sans">
                        {money(Number(item.variant?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs font-sans">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Truck className="size-3.5 text-gold" />Standard Shipping</span>
                  <span className="text-white font-medium">{money(SHIPPING_FEE)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-3 text-lg font-serif text-white">
                  <span>Total Payable</span>
                  <span className="text-gold font-serif font-bold">{money(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing || unavailableItems.length > 0}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-gold py-4 text-xs font-bold tracking-[0.2em] text-background hover:bg-gold-soft transition-all duration-300 disabled:opacity-50 uppercase cursor-pointer"
              >
                {placing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>REDIRECTING TO PHONEPE…</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5 stroke-[2.5]" />
                    <span>PLACE ORDER & PAY</span>
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-border/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-sans">
                  <ShieldCheck className="size-4 text-gold shrink-0" />
                  <span>Guaranteed Safe &amp; Secure Checkout via PhonePe</span>
                </div>
              </div>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
