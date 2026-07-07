"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Package, ShoppingCart } from "lucide-react";
import Header from "@/components/header";
import { API_BASE } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ApiProduct, ProductVariant, variantSnapshot } from "@/services/products";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(`${API_BASE}/products/${slug}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "Product not found");
        return data as ApiProduct;
      })
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        setSelectedVariantId(data.variants.find((variant) => variant.stock > 0)?.id || data.variants[0]?.id || "");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVariant = useMemo<ProductVariant | undefined>(
    () => product?.variants.find((variant) => variant.id === selectedVariantId),
    [product, selectedVariantId],
  );

  const image = selectedVariant?.imageUrls?.[0] || product?.defaultImageUrls?.[0];
  const unavailable = !selectedVariant || selectedVariant.stock < 1;

  const handleAdd = async () => {
    if (!product || !selectedVariant || unavailable) return;
    setIsAdding(true);
    try {
      await addToCart(selectedVariant.id, 1, variantSnapshot(product, selectedVariant));
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-[1200px] px-6 pt-32">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse bg-card" />
            <div className="space-y-5">
              <div className="h-8 w-2/3 animate-pulse bg-card" />
              <div className="h-4 w-full animate-pulse bg-card" />
              <div className="h-12 w-48 animate-pulse bg-card" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-[900px] px-6 pt-32 text-center">
          <h1 className="font-serif text-3xl text-white mb-3">Product unavailable</h1>
          <p className="text-muted-foreground mb-8">{error || "This product could not be found."}</p>
          <Link href="/shop" className="bg-gold px-6 py-3 text-xs font-bold tracking-[0.2em] text-background">
            CONTINUE SHOPPING
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 lg:px-8 pt-28 pb-16">
        <div className="grid gap-10 md:grid-cols-[1fr_0.9fr]">
          <div className="relative aspect-square overflow-hidden border border-border bg-card">
            {image ? (
              <Image src={image} alt={product.name} fill className="object-cover" priority sizes="50vw" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="size-16 text-muted-foreground" strokeWidth={1.2} />
              </div>
            )}
          </div>

          <section className="flex flex-col justify-center">
            {product.brand && <p className="text-xs tracking-[0.25em] text-gold uppercase mb-3">{product.brand}</p>}
            <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">{product.name}</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">{product.description || "Premium eyewear crafted for everyday clarity and presence."}</p>

            <div className="mb-8">
              <p className="mb-3 text-xs tracking-[0.2em] uppercase text-muted-foreground">Variant</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={variant.stock < 1}
                    className={`border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      selectedVariantId === variant.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/60"
                    }`}
                  >
                    <span className="block text-sm text-white">{variant.color || variant.sku}</span>
                    <span className="block text-xs text-muted-foreground">{variant.lensType || variant.material || "Standard lens"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="font-serif text-3xl text-gold tabular-nums">{formatPrice(selectedVariant?.price || product.startingPrice)}</span>
              <button
                onClick={handleAdd}
                disabled={unavailable || isAdding}
                className="inline-flex items-center justify-center gap-2 bg-gold px-8 py-3.5 text-xs font-bold tracking-[0.2em] text-background transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isAdding ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
                {unavailable ? "UNAVAILABLE" : "ADD TO CART"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
