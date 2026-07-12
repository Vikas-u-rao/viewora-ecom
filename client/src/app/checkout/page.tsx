"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Smartphone, Truck } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Address, AddressPayload, fetchAddressesApi, saveAddressApi } from "@/services/account";
import { createOrderApi, orderItemsFromCart, initiatePaymentApi } from "@/services/orders";
import { COUPON_STORAGE_KEY } from "@/services/coupons";

const SHIPPING_FEE = 99;

const emptyAddress: AddressPayload = {
  label: "Home",
  name: "",
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
  const { user, accessToken } = useAuth();
  const { items, subtotal } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressForm, setAddressForm] = useState<AddressPayload>({ ...emptyAddress });
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);

  const availableItems = items.filter((item) => !item.productUnavailable && item.variant);
  const unavailableItems = items.filter((item) => item.productUnavailable);
  const total = subtotal + (availableItems.length > 0 ? SHIPPING_FEE : 0);

  useEffect(() => {
    if (!accessToken) {
      setShowNewAddress(true);
      return;
    }
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
    if (availableItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (unavailableItems.length > 0) {
      toast.error("Remove unavailable items before checkout.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    if (!user && !guestEmail.trim()) {
      toast.error("Email address is required for guest checkout.");
      return;
    }
    if (showNewAddress && (!payloadAddress.shippingName || !payloadAddress.shippingLine1 || !payloadAddress.shippingCity || !payloadAddress.shippingState || !payloadAddress.shippingPincode)) {
      toast.error("Please complete the shipping address.");
      return;
    }

    setPlacing(true);
    try {
      // Step 1 — save address if needed
      let addressId = selectedAddressId;
      if (user && accessToken && showNewAddress) {
        const saved = await saveAddressApi(accessToken, { ...addressForm, isDefault: addresses.length === 0 || addressForm.isDefault });
        addressId = saved.id;
      }

      // Read applied coupon from localStorage
      const storedCoupon = typeof window !== 'undefined' ? localStorage.getItem(COUPON_STORAGE_KEY) : null;
      const parsedCoupon = storedCoupon ? JSON.parse(storedCoupon) : null;

      // Step 2 — create the order (status: pending)
      const { order } = await createOrderApi(
        {
          ...(user ? { addressId } : { ...payloadAddress, guestEmail: guestEmail.trim().toLowerCase(), guestPhone: phone.trim() }),
          ...(!user && { guestPhone: phone.trim() }),
          items: orderItemsFromCart(items),
          ...(parsedCoupon ? { couponCode: parsedCoupon.code } : {}),
        },
        accessToken
      );

      // Step 3 — initiate PhonePe payment and redirect to their payment page
      toast.loading("Redirecting to payment…", { id: "payment-redirect" });
      const { redirectUrl } = await initiatePaymentApi(order.id, accessToken);
      toast.dismiss("payment-redirect");

      // Store guest order marker before redirect so the confirmation page can detect it
      if (!user) {
        localStorage.setItem(`viewora_guest_order_${order.id}`, "1");
      }

      // Clear stored coupon after successful order
      localStorage.removeItem(COUPON_STORAGE_KEY);

      // Hard-redirect to PhonePe hosted payment page
      window.location.href = redirectUrl;
    } catch (error) {
      toast.dismiss("payment-redirect");
      toast.error(error instanceof Error ? error.message : "Failed to place order.");
      setPlacing(false);
    }
    // Note: don't set placing=false on success — the page navigates away
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 pt-28 pb-16">
        <h1 className="font-serif text-4xl text-white mb-8">Checkout</h1>

        {items.length === 0 ? (
          <div className="border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Link href="/shop" className="bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background">CONTINUE SHOPPING</Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="space-y-6">
              <div className="border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-2xl text-white">Shipping Address</h2>
                  {user && <button type="button" onClick={() => setShowNewAddress((value) => !value)} className="text-gold"><Plus className="size-4" /></button>}
                </div>

                {user && addresses.length > 0 && !showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((address) => (
                      <button
                        type="button"
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`border p-4 text-left ${selectedAddressId === address.id ? "border-gold bg-gold/10" : "border-border"}`}
                      >
                        <span className="block font-medium text-white">{address.name}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{address.line1}, {address.city}, {address.state} - {address.pincode}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["name", "line1", "line2", "city", "state", "pincode"] as const).map((field) => (
                      <input
                        key={field}
                        required={field !== "line2"}
                        placeholder={field === "line1" ? "Address line 1" : field === "line2" ? "Address line 2" : field[0].toUpperCase() + field.slice(1)}
                        value={String(addressForm[field] || "")}
                        onChange={(event) => setAddressForm((prev) => ({ ...prev, [field]: event.target.value }))}
                        className="border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-border bg-card p-5">
                <h2 className="font-serif text-2xl text-white mb-4">Contact</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {!user && (
                    <input type="email" required placeholder="Email address" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} className="border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold" />
                  )}
                  <input type="tel" required placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} className="border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold" />
                </div>
              </div>

              <div className="border border-gold bg-gold/10 p-5">
                <h2 className="font-serif text-2xl text-white mb-3">Payment</h2>
                <div className="flex items-center gap-3 text-gold">
                  <Smartphone className="size-5" />
                  <span className="text-sm font-semibold tracking-[0.15em]">PHONEPE — UPI / Cards / Netbanking</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">You will be securely redirected to PhonePe to complete payment.</p>
              </div>
            </section>

            <aside className="h-fit border border-border bg-card p-5 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl text-white mb-5">Order Summary</h2>
              <div className="space-y-4">
                {availableItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{item.variant?.product.name} x {item.quantity}</span>
                    <span className="text-white">{money(Number(item.variant?.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span className="flex items-center gap-1.5"><Truck className="size-3.5" />Shipping</span><span>{money(SHIPPING_FEE)}</span></div>
                <div className="flex justify-between border-t border-border pt-3 text-xl text-white"><span>Total</span><span className="text-gold">{money(total)}</span></div>
              </div>
              <button disabled={placing || unavailableItems.length > 0} className="mt-6 flex w-full items-center justify-center gap-2 bg-gold py-3.5 text-xs font-bold tracking-[0.2em] text-background disabled:opacity-50">
                {placing && <Loader2 className="size-4 animate-spin" />}
                {placing ? "REDIRECTING TO PAYMENT…" : "PLACE ORDER & PAY"}
              </button>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
