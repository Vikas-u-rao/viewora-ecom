"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Smartphone, Truck, Wallet } from "lucide-react";
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
                  <button type="button" onClick={() => setShowNewAddress((value) => !value)} className="text-gold"><Plus className="size-4" /></button>
                </div>

                {addresses.length > 0 && !showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((address) => (
                      <button
                        type="button"
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`border p-4 text-left ${selectedAddressId === address.id ? "border-gold bg-gold/10" : "border-border"}`}
                      >
                        <span className="block font-medium text-white">{address.name}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{address.line1}, {address.city}, {address.state} - {address.pincode}{address.phone ? ` | ${address.phone}` : ""}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showNewAddress && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["name", "phone", "line1", "line2", "city", "state", "pincode"] as const).map((field) => (
                      <input
                        key={field}
                        required={field !== "line2"}
                        placeholder={field === "line1" ? "Address line 1" : field === "line2" ? "Address line 2" : field === "phone" ? "Phone number" : field[0].toUpperCase() + field.slice(1)}
                        value={String(addressForm[field] || "")}
                        onChange={(event) => setAddressForm((prev) => ({ ...prev, [field]: event.target.value }))}
                        className="border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-gold"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-border bg-card p-5">
                <h2 className="font-serif text-2xl text-white mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 border border-gold bg-gold/10">
                    <Smartphone className="size-5 text-gold" />
                    <div>
                      <span className="text-sm font-semibold tracking-[0.15em] text-white">PhonePe</span>
                      <p className="text-xs text-muted-foreground">UPI / Cards / Netbanking</p>
                    </div>
                  </div>
                </div>
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
                {placing ? "PLACING ORDER…" : "PLACE ORDER & PAY"}
              </button>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
