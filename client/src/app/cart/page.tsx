'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/header';
import { validateCouponApi, COUPON_STORAGE_KEY } from '@/services/coupons';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Tag,
  Truck,
  ShieldCheck,
  Package,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import ProductImage from '@/components/ProductImage';

// ── Constants ───────────────────────────────────────────────────────────────

const SHIPPING_FEE = 99;

// ── Helper: format INR ──────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Cart Page ───────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const {
    items,
    isLoading,
    cartCount,
    subtotal,
    updateQuantity,
    removeItem,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{id: string; code: string; value: string} | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const availableItems = items.filter((i) => !i.productUnavailable);
  const unavailableItems = items.filter((i) => i.productUnavailable);
  const discountAmount = appliedCoupon ? Number(appliedCoupon.value) : 0;
  const total = subtotal + (availableItems.length > 0 ? SHIPPING_FEE : 0) - discountAmount;

  // Restore applied coupon from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(COUPON_STORAGE_KEY) : null;
    if (stored) {
      try {
        setAppliedCoupon(JSON.parse(stored));
      } catch {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    }
  }, []);

  // ── Quantity change handler with loading state ──────────────────────────

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    await updateQuantity(itemId, newQuantity);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    await removeItem(itemId);
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    try {
      const result = await validateCouponApi(
        couponCode.trim().toUpperCase(),
        accessToken,
        undefined,
        undefined,
      );
      setAppliedCoupon(result.coupon);
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(result.coupon));
      toast.success(`Coupon applied! You saved ₹${Number(result.coupon.value).toLocaleString('en-IN')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid coupon');
      setAppliedCoupon(null);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  };

  const handleCheckout = async () => {
    if (unavailableItems.length > 0) {
      toast.error('Remove unavailable products before checkout.');
      return;
    }
    if (availableItems.length === 0) {
      toast.error('Add items to checkout.');
      return;
    }
    router.push('/checkout');
  };

  // ── Loading state ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-28 pb-16">
          <h1 className="font-serif text-3xl mb-8">Shopping Cart</h1>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Skeleton items */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-border bg-card p-5 animate-pulse flex gap-5"
                >
                  <div className="w-24 h-24 bg-muted rounded-sm shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton summary */}
            <div className="border border-border bg-card p-6 animate-pulse space-y-4 h-fit">
              <div className="h-5 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-12 bg-muted rounded w-full mt-4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Empty cart state ──────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 pb-16 pt-28">
          <div className="text-center max-w-md mx-auto">
            <div className="relative mx-auto mb-8 w-28 h-28 flex items-center justify-center">
              {/* Decorative rings */}
              <div className="absolute inset-0 rounded-full border border-gold/20 animate-[pulse_3s_ease-in-out_infinite]" />
              <div className="absolute inset-3 rounded-full border border-gold/10" />
              <ShoppingBag className="size-12 text-gold/60" strokeWidth={1} />
            </div>
            <h1 className="font-serif text-3xl text-foreground mb-3">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Looks like you haven&apos;t added any eyewear to your collection yet.
              Explore our curated selection of premium frames.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 bg-gold text-background px-8 py-3.5 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-colors group"
            >
              EXPLORE COLLECTION
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* Trust badges */}
            <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="size-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wider uppercase">₹99 Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="size-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wider uppercase">Secure Pay</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Package className="size-5" strokeWidth={1.5} />
                <span className="text-[10px] tracking-wider uppercase">Genuine Frames</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Cart with items ───────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 pt-28 pb-16">
          <div className="text-center max-w-md">
            <ShoppingBag className="mx-auto mb-6 size-16 text-muted-foreground" strokeWidth={1.2} />
            <h1 className="font-serif text-3xl text-white mb-3">Log in to view your cart</h1>
            <p className="text-muted-foreground mb-8">Sign in to see items you&apos;ve added and proceed to checkout.</p>
            <Link href="/login" className="inline-flex bg-gold px-8 py-3 text-xs font-bold tracking-[0.2em] text-background hover:bg-gold-soft transition-colors">
              LOG IN
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 pt-28 pb-16">
        {/* Page header */}
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="font-serif text-3xl text-foreground">
            Shopping Cart
          </h1>
          <span className="text-muted-foreground text-sm">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
          {/* ── Cart Items Column ───────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Unavailable items warning */}
            {unavailableItems.length > 0 && (
              <div className="border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3 mb-2">
                <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300 mb-1">
                    {unavailableItems.length} item{unavailableItems.length > 1 ? 's are' : ' is'} no longer available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please remove them to continue with checkout.
                  </p>
                </div>
              </div>
            )}

            {/* Unavailable items */}
            {unavailableItems.map((item) => (
              <div
                key={item.id}
                className="border border-amber-500/20 bg-card/50 p-4 flex gap-4 md:gap-5 relative opacity-70"
              >
                {/* Image */}
                <div className="w-20 h-20 md:w-28 md:h-28 bg-muted/30 shrink-0 relative overflow-hidden">
                  <ProductImage
                    src={item.variant?.imageUrls?.[0] || ''}
                    alt={item.variant?.product?.name || 'Product'}
                    sizes="112px"
                    className="grayscale opacity-60"
                  />
                  <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
                    <span className="text-[9px] tracking-wider uppercase font-bold bg-amber-500/90 text-background px-2 py-0.5">
                      Unavailable
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground/70 truncate">
                    {item.variant?.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This product is no longer available — please remove it.
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={updatingItems.has(item.id)}
                  className="self-center text-muted-foreground hover:text-destructive transition-colors p-2 shrink-0"
                  aria-label="Remove unavailable item"
                >
                  {updatingItems.has(item.id) ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-5" />
                  )}
                </button>
              </div>
            ))}

            {/* Available items */}
            {availableItems.map((item) => {
              const price = item.variant ? parseFloat(item.variant.price) : 0;
              const lineTotal = price * item.quantity;
              const maxStock = item.variant?.stock || 10;
              const isUpdating = updatingItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className="border border-border bg-card p-4 flex gap-4 md:gap-5 transition-all hover:border-border/80 group"
                >
                  {/* Product image */}
                  <Link
                    href={item.variant?.product?.slug ? `/products/${item.variant.product.slug}` : '#'}
                    className="w-20 h-20 md:w-28 md:h-28 shrink-0 relative overflow-hidden border border-border/40 hover:border-gold/40 transition-colors"
                  >
                    <ProductImage
                      src={item.variant?.imageUrls?.[0] || ''}
                      alt={item.variant?.product?.name || 'Product'}
                      sizes="112px"
                    />
                  </Link>

                  {/* Product details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Brand */}
                      {item.variant?.product?.brand && (
                        <p className="text-[10px] tracking-[0.2em] uppercase text-gold mb-0.5">
                          {item.variant.product.brand}
                        </p>
                      )}

                      {/* Name */}
                      <Link
                    href={item.variant?.product?.slug ? `/products/${item.variant.product.slug}` : '#'}
                        className="font-medium text-sm text-foreground hover:text-gold transition-colors line-clamp-1"
                      >
                        {item.variant?.product?.name || 'Product'}
                      </Link>

                      {/* Variant details */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                        {item.variant?.color && (
                          <span>Color: <span className="text-foreground/80">{item.variant.color}</span></span>
                        )}
                        {item.variant?.size && (
                          <span>Size: <span className="text-foreground/80">{item.variant.size}</span></span>
                        )}
                        {item.variant?.lensType && (
                          <span>Lens: <span className="text-foreground/80">{item.variant.lensType}</span></span>
                        )}
                        {item.variant?.material && (
                          <span>Material: <span className="text-foreground/80">{item.variant.material}</span></span>
                        )}
                      </div>
                    </div>

                    {/* Price + Quantity Row */}
                    <div className="flex items-center justify-between mt-3 gap-3">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>

                        <span className="w-10 h-8 flex items-center justify-center text-sm font-medium border-l border-r border-border tabular-nums">
                          {isUpdating ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            item.quantity
                          )}
                        </span>

                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= maxStock || isUpdating}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      {/* Line price */}
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-foreground tabular-nums">
                          {formatPrice(lineTotal)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {formatPrice(price)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isUpdating}
                    className="self-start text-muted-foreground hover:text-destructive transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}

            {/* Continue shopping link */}
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors group"
              >
                <ArrowRight className="size-3.5 rotate-180 transition-transform group-hover:-translate-x-1" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* ── Order Summary Sidebar ──────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Coupon input */}
            <div className="border border-border bg-card p-5">
              <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2.5 font-medium">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-full bg-input border border-border pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold transition-colors uppercase tracking-wider"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  className="border border-gold text-gold hover:bg-gold hover:text-background px-4 py-2.5 text-xs font-bold tracking-wider transition-colors shrink-0"
                >
                  APPLY
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
                Coupon rewards launching soon — complete orders over ₹5,000 to earn yours.
              </p>
            </div>

            {/* Summary */}
            <div className="border border-border bg-card p-5">
              <h2 className="font-serif text-xl text-foreground mb-5 pb-3 border-b border-border">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({availableItems.length} {availableItems.length === 1 ? 'item' : 'items'})</span>
                  <span className="text-foreground tabular-nums">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Discount{appliedCoupon ? <span className="ml-1.5 text-[10px] text-gold uppercase tracking-wider">({appliedCoupon.code})</span> : null}</span>
                  <span className="text-foreground tabular-nums">
                    {appliedCoupon ? `−${formatPrice(discountAmount)}` : formatPrice(0)}
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Truck className="size-3.5" />
                    Shipping
                  </span>
                  <span className="text-foreground tabular-nums">
                    {availableItems.length > 0 ? formatPrice(SHIPPING_FEE) : formatPrice(0)}
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST Inclusive)</span>
                  <span className="text-foreground tabular-nums">{formatPrice(0)}</span>
                </div>

                <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
                  <span className="font-serif text-lg text-foreground">Total</span>
                  <span className="font-serif text-2xl text-gold tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                disabled={availableItems.length === 0 || unavailableItems.length > 0}
                onClick={handleCheckout}
                className="w-full mt-4 bg-gold text-background py-3.5 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                PROCEED TO CHECKOUT
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Trust signals */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" strokeWidth={1.5} />
                  <span className="text-[10px] tracking-wider">Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="size-3.5" strokeWidth={1.5} />
                  <span className="text-[10px] tracking-wider">Genuine Frames</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
