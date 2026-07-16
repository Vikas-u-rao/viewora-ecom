"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Loader2, Package, ShoppingCart, Tag, ShieldAlert, ArrowLeft, Plus, Check } from "lucide-react";

// Types matching backend models
interface Variant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  variants: Variant[];
}

interface OrderItem {
  id: string;
  skuSnapshot: string;
  quantity: number;
  priceAtPurchase: string;
  variant?: {
    product?: {
      name: string;
    };
  };
}

interface Order {
  id: string;
  shippingName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user?: {
    email: string;
    name: string;
    phone?: string | null;
  } | null;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus: "unfulfilled" | "processing" | "shipped" | "delivered" | "cancelled";
  finalPayableAmount: string;
  createdAt: string;
  items: OrderItem[];
}

interface Coupon {
  id: string;
  code: string;
  value: string;
  status: "active" | "used" | "expired";
  expiresAt: string;
  user?: {
    email: string;
  } | null;
}

export default function AdminDashboard() {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "coupons">("inventory");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Loading and Error states
  const [fetchLoading, setFetchLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stock edit states
  const [editingStock, setEditingStock] = useState<Record<string, number | undefined>>({});

  // Coupon form states
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponValue, setNewCouponValue] = useState("");
  const [newCouponExpiry, setNewCouponExpiry] = useState("");
  const [newCouponUserEmail, setNewCouponUserEmail] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  // Check auth and role
  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "admin") {
        router.replace("/");
      }
    }
  }, [user, isLoading, router]);

  // Fetch tab data
  useEffect(() => {
    if (!accessToken || !user || user.role !== "admin") return;

    const fetchData = async () => {
      setFetchLoading(true);
      setErrorMsg(null);
      try {
        if (activeTab === "inventory") {
          const res = await fetch(`${apiUrl}/admin/products`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) throw new Error("Failed to load products");
          const data = await res.json();
          setProducts(data.products || []);
        } else if (activeTab === "orders") {
          const res = await fetch(`${apiUrl}/admin/orders`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) throw new Error("Failed to load orders");
          const data = await res.json();
          setOrders(data.orders || []);
        } else if (activeTab === "coupons") {
          const res = await fetch(`${apiUrl}/admin/coupons`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) throw new Error("Failed to load coupons");
          const data = await res.json();
          setCoupons(data.coupons || []);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || "An error occurred while fetching data.");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [activeTab, accessToken, user, apiUrl]);

  // Handle stock level updates
  const handleUpdateStock = async (variantId: string) => {
    const stockVal = editingStock[variantId];
    if (stockVal === undefined || stockVal < 0) return;

    setActionLoading(variantId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/variants/${variantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ stock: Number(stockVal) }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || "Failed to update stock");
      }

      setProducts((prevProducts) =>
        prevProducts.map((p) => ({
          ...p,
          variants: p.variants.map((v) =>
            v.id === variantId ? { ...v, stock: Number(stockVal) } : v
          ),
        }))
      );
      setSuccessMsg("Stock level updated successfully!");
      // clear edit state
      const nextEditing = { ...editingStock };
      delete nextEditing[variantId];
      setEditingStock(nextEditing);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Could not update stock.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle fulfillment status update
  const handleUpdateFulfillment = async (orderId: string, status: string) => {
    setActionLoading(orderId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/fulfillment-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || "Failed to update status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: status as Order["fulfillmentStatus"] } : o))
      );
      setSuccessMsg("Fulfillment status updated!");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to update fulfillment.");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle refund initiation
  const handleInitiateRefund = async (orderId: string) => {
    const reason = prompt("Enter the reason for this refund:");
    if (!reason) return;
    const amountStr = prompt("Enter refund amount (leave blank for full refund):");

    setActionLoading(`refund-${orderId}`);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const body: { reason: string; amount?: number } = { reason };
      if (amountStr) body.amount = Number(amountStr);

      const res = await fetch(`${apiUrl}/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || "Failed to process refund");
      }

      // Reload orders to reflect updated status
      const ordersRes = await fetch(`${apiUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await ordersRes.json();
      setOrders(data.orders || []);
      setSuccessMsg("Refund processed successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to process refund.");
    } finally {
      setActionLoading(null);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponValue || !newCouponExpiry) return;

    setActionLoading("create-coupon");
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const body: { code: string; value: number; expiresAt: string; userEmail?: string } = {
        code: newCouponCode,
        value: Number(newCouponValue),
        expiresAt: new Date(newCouponExpiry).toISOString(),
      };
      if (newCouponUserEmail) {
        body.userEmail = newCouponUserEmail;
      }

      const res = await fetch(`${apiUrl}/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || "Failed to create coupon");
      }

      const data = await res.json();
      setCoupons((prev) => [data.coupon, ...prev]);
      setSuccessMsg(`Coupon ${newCouponCode} created!`);
      // Reset form
      setNewCouponCode("");
      setNewCouponValue("");
      setNewCouponExpiry("");
      setNewCouponUserEmail("");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to create coupon.");
    } finally {
      setActionLoading(null);
    }
  };

  // Invalidate/Delete Coupon
  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to invalidate this coupon?")) return;

    setActionLoading(`delete-coupon-${couponId}`);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${apiUrl}/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error?.message || "Failed to delete coupon");
      }

      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, status: "expired" } : c))
      );
      setSuccessMsg("Coupon invalidated!");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to delete coupon.");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-32">
          <Loader2 className="size-8 animate-spin text-gold" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center pt-32 px-6 text-center">
          <ShieldAlert className="size-16 text-red-500 mb-4" />
          <h1 className="font-serif text-3xl mb-2 text-white">Access Denied</h1>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            You do not have administrative permissions to view this dashboard.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="flex items-center gap-2 border border-gold/50 text-gold px-6 py-2.5 text-xs font-bold tracking-widest hover:bg-gold hover:text-background transition-colors"
          >
            <ArrowLeft className="size-3.5" /> RETURN HOME
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Header titles */}
          <div className="text-center mb-10">
            <p className="text-gold tracking-[0.3em] text-xs mb-3 font-medium">ADMINISTRATOR PORTAL</p>
            <h1 className="font-serif text-4xl text-white">Store Backoffice</h1>
            <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4"></div>
          </div>

          {/* Toast Feedbacks */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800 text-red-300 text-sm font-sans flex items-center gap-2 rounded-sm">
              <ShieldAlert className="size-4" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm font-sans flex items-center gap-2 rounded-sm">
              <Check className="size-4" /> {successMsg}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-border mb-8 overflow-x-auto gap-4">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2.5 pb-4 px-2 text-sm tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "inventory"
                  ? "border-accent-pink text-accent-pink"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              <Package className="size-4" /> INVENTORY MANAGEMENT
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2.5 pb-4 px-2 text-sm tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "border-accent-pink text-accent-pink"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              <ShoppingCart className="size-4" /> CUSTOMER ORDERS
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`flex items-center gap-2.5 pb-4 px-2 text-sm tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "coupons"
                  ? "border-accent-pink text-accent-pink"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              <Tag className="size-4" /> DISCOUNT COUPONS
            </button>
          </div>

          {/* Content Loading Skeleton */}
          {fetchLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 border border-border bg-card/45 animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            <div>
              {/* TAB 1: INVENTORY MANAGEMENT */}
              {activeTab === "inventory" && (
                <div className="space-y-6 font-sans">
                  {products.length === 0 ? (
                    <p className="text-muted-foreground text-center py-10">No products configured in catalog.</p>
                  ) : (
                    products.map((p) => (
                      <div key={p.id} className="border border-border p-5 bg-card/25 rounded-md hover:border-gold/30 transition-colors">
                        <div className="mb-4">
                          {p.brand && <span className="text-[10px] tracking-widest text-gold font-bold uppercase">{p.brand}</span>}
                          <h3 className="font-serif text-lg text-white font-medium">{p.name}</h3>
                        </div>

                        {/* Variants list table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-border/60 text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="pb-2">SKU</th>
                                <th className="pb-2">Color / Size</th>
                                <th className="pb-2">Price</th>
                                <th className="pb-2">Current Stock</th>
                                <th className="pb-2 text-right">Update Levels</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 text-white/95">
                              {p.variants.map((v) => (
                                <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2.5 font-mono text-xs">{v.sku}</td>
                                  <td className="py-2.5">
                                    {v.color || "-"} {v.size ? `(${v.size})` : ""}
                                  </td>
                                  <td className="py-2.5">₹{Number(v.price).toLocaleString("en-IN")}</td>
                                  <td className="py-2.5 font-semibold">
                                    {v.stock <= 2 ? (
                                      <span className="text-red-400 font-bold">{v.stock} (Low)</span>
                                    ) : (
                                      <span className="text-emerald-400">{v.stock}</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <div className="inline-flex items-center gap-2">
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="New qty"
                                        value={editingStock[v.id] ?? ""}
                                        onChange={(e) =>
                                          setEditingStock({
                                            ...editingStock,
                                            [v.id]: e.target.value === "" ? undefined : Number(e.target.value),
                                          })
                                        }
                                        className="w-20 bg-background border border-border px-2 py-1 text-xs text-white focus:border-gold outline-none"
                                      />
                                      <button
                                        onClick={() => handleUpdateStock(v.id)}
                                        disabled={actionLoading === v.id || editingStock[v.id] === undefined}
                                        className="bg-gold text-background hover:bg-gold-soft px-3 py-1 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        {actionLoading === v.id ? (
                                          <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                          "SET"
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: CUSTOMER ORDERS */}
              {activeTab === "orders" && (
                <div className="space-y-6 font-sans">
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-10">No customer orders found.</p>
                  ) : (
                    orders.map((o) => (
                      <div key={o.id} className="border border-border p-5 bg-card/25 rounded-md flex flex-col gap-4">
                        {/* Order Meta Header */}
                        <div className="flex flex-wrap items-center justify-between border-b border-border/50 pb-3 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">ORDER ID</p>
                            <p className="font-mono text-sm text-white font-semibold">{o.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground text-right">DATE</p>
                            <p className="text-sm text-white/90">{new Date(o.createdAt).toLocaleDateString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">PAYMENT STATUS</p>
                            <span
                              className={`text-xs px-2 py-0.5 font-bold uppercase rounded-sm border ${
                                o.paymentStatus === "paid"
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                                  : o.paymentStatus === "refunded"
                                  ? "bg-blue-950/40 text-blue-400 border-blue-800"
                                  : "bg-amber-950/40 text-amber-400 border-amber-800"
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">FULFILLMENT</p>
                            <span
                              className={`text-xs px-2 py-0.5 font-bold uppercase rounded-sm border ${
                                o.fulfillmentStatus === "delivered"
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                                  : o.fulfillmentStatus === "cancelled"
                                  ? "bg-red-950/40 text-red-400 border-red-800"
                                  : "bg-amber-950/40 text-amber-400 border-amber-800"
                              }`}
                            >
                              {o.fulfillmentStatus}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Order Items list */}
                        <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 text-sm">
                          <div>
                            <h4 className="text-gold text-xs uppercase tracking-wider mb-2 font-semibold">Customer Details</h4>
                            <p className="text-white font-medium">{o.shippingName || "Guest User"}</p>
                            <p className="text-muted-foreground text-xs">{o.guestEmail || o.user?.email || "No email"}</p>
                            <p className="text-muted-foreground text-xs">{o.guestPhone || o.user?.phone || "-"}</p>
                          </div>
                          <div>
                            <h4 className="text-gold text-xs uppercase tracking-wider mb-2 font-semibold">Ordered Items</h4>
                            <ul className="divide-y divide-border/30 space-y-1.5">
                              {o.items.map((i) => (
                                <li key={i.id} className="pt-1.5 flex justify-between gap-4 text-xs">
                                  <span className="text-white/80">
                                    {i.variant?.product?.name || "Eyewear"} ({i.skuSnapshot}) <strong className="text-gold font-normal">x{i.quantity}</strong>
                                  </span>
                                  <span className="text-white font-medium">₹{Number(i.priceAtPurchase).toLocaleString("en-IN")}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 pt-2 border-t border-border/40 flex justify-between text-white font-semibold">
                              <span>Total Amount:</span>
                              <span className="text-gold">₹{Number(o.finalPayableAmount).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Bar */}
                        <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-4 gap-4">
                          <div className="flex items-center gap-2">
                            <label htmlFor={`fulfillment-${o.id}`} className="text-xs text-muted-foreground">Fulfillment Status:</label>
                            <select
                              id={`fulfillment-${o.id}`}
                              value={o.fulfillmentStatus}
                              disabled={actionLoading === o.id}
                              onChange={(e) => handleUpdateFulfillment(o.id, e.target.value)}
                              className="bg-background border border-border text-xs text-white px-2 py-1 outline-none focus:border-gold cursor-pointer"
                            >
                              <option value="unfulfilled">Unfulfilled</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          {o.paymentStatus === "paid" && (
                            <button
                              onClick={() => handleInitiateRefund(o.id)}
                              disabled={actionLoading === `refund-${o.id}`}
                              className="border border-red-500/50 hover:bg-red-500 hover:text-white px-3 py-1.5 text-xs text-red-400 font-bold transition-all flex items-center justify-center min-w-[90px]"
                            >
                              {actionLoading === `refund-${o.id}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Refund Order"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: DISCOUNT COUPONS */}
              {activeTab === "coupons" && (
                <div className="grid md:grid-cols-[1fr_1.8fr] gap-8 font-sans">
                  {/* Create coupon form card */}
                  <div className="border border-border p-5 bg-card/25 rounded-md h-fit">
                    <h3 className="font-serif text-lg text-white mb-4 flex items-center gap-2">
                      <Plus className="size-4 text-gold" /> Create New Coupon
                    </h3>
                    <form onSubmit={handleCreateCoupon} className="space-y-4 text-sm">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="code" className="text-xs text-muted-foreground">Coupon Code (e.g. EXTRA10)</label>
                        <input
                          id="code"
                          type="text"
                          required
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          placeholder="e.g. HELLO20"
                          className="bg-background border border-border px-3 py-2 text-white focus:border-gold outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="value" className="text-xs text-muted-foreground">Discount Value (in INR)</label>
                        <input
                          id="value"
                          type="number"
                          required
                          min="1"
                          value={newCouponValue}
                          onChange={(e) => setNewCouponValue(e.target.value)}
                          placeholder="e.g. 500"
                          className="bg-background border border-border px-3 py-2 text-white focus:border-gold outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="expiry" className="text-xs text-muted-foreground">Expiry Date</label>
                        <input
                          id="expiry"
                          type="date"
                          required
                          value={newCouponExpiry}
                          onChange={(e) => setNewCouponExpiry(e.target.value)}
                          className="bg-background border border-border px-3 py-2 text-white focus:border-gold outline-none cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="target-email" className="text-xs text-muted-foreground">Target User Email (Optional)</label>
                        <input
                          id="target-email"
                          type="email"
                          value={newCouponUserEmail}
                          onChange={(e) => setNewCouponUserEmail(e.target.value)}
                          placeholder="e.g. customer@email.com"
                          className="bg-background border border-border px-3 py-2 text-white focus:border-gold outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading === "create-coupon"}
                        className="w-full bg-accent-pink hover:opacity-90 text-[#0d0b09] py-2.5 text-xs font-bold tracking-[0.15em] transition-opacity flex items-center justify-center"
                      >
                        {actionLoading === "create-coupon" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "CREATE COUPON"
                        )}
                      </button>
                    </form>
                  </div>

                  {/* List coupons view */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg text-white mb-2">Existing Coupons</h3>
                    {coupons.length === 0 ? (
                      <p className="text-muted-foreground text-center py-10">No coupons active.</p>
                    ) : (
                      <div className="border border-border rounded-md overflow-hidden bg-card/10">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider bg-card/25">
                              <th className="p-3">Code</th>
                              <th className="p-3">Discount</th>
                              <th className="p-3">User Email</th>
                              <th className="p-3">Expires At</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50 text-white/95">
                            {coupons.map((c) => (
                              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-mono font-bold text-xs text-gold">{c.code}</td>
                                <td className="p-3">₹{Number(c.value).toLocaleString("en-IN")}</td>
                                <td className="p-3 text-xs text-muted-foreground">
                                  {c.user?.email || "Global (Any User)"}
                                </td>
                                <td className="p-3 text-xs">
                                  {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 uppercase font-bold rounded-sm border ${
                                      c.status === "active"
                                        ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/40"
                                        : "bg-red-950/30 text-red-400 border-red-800/40"
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  {c.status === "active" && (
                                    <button
                                      onClick={() => handleDeleteCoupon(c.id)}
                                      disabled={actionLoading === `delete-coupon-${c.id}`}
                                      className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                                    >
                                      {actionLoading === `delete-coupon-${c.id}` ? (
                                        <Loader2 className="size-3 animate-spin ml-auto" />
                                      ) : (
                                        "Invalidate"
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
