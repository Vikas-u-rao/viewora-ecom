"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { StaticImageData } from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Heart, Loader2, ShoppingCart, Plus, Check } from "lucide-react";
import Header from "@/components/header";
import { API_BASE } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ApiProduct, ProductVariant, variantSnapshot } from "@/services/products";
import ProductImage from "@/components/ProductImage";

import { formatPrice } from "@/lib/format";
import { getFallbackImage, resolveImageUrl } from "@/lib/productImage";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, items } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fallback = getFallbackImage(product?.slug || "");

  const allImages = useMemo(() => {
    const list: (string | StaticImageData)[] = [];
    if (selectedVariant?.imageUrls?.length) {
      list.push(...selectedVariant.imageUrls.map((u) => resolveImageUrl(u) || u));
    }
    if (product?.defaultImageUrls?.length) {
      product.defaultImageUrls.forEach((img) => {
        const resolved = resolveImageUrl(img) || img;
        if (!list.includes(resolved)) list.push(resolved);
      });
    }
    if (list.length === 0) list.push(fallback);
    return list;
  }, [selectedVariant, product, fallback]);

  const activeImage = allImages[activeImageIndex] || allImages[0] || fallback;
  const unavailable = !selectedVariant || selectedVariant.stock < 1;

  const wishlisted = product ? isWishlisted(product.id) : false;

  const cartItem = selectedVariant ? items.find((i) => i.variantId === selectedVariant.id) : undefined;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveImageIndex(0);
  }, [selectedVariantId]);

  useEffect(() => {
    if (showCheck) {
      const timer = setTimeout(() => setShowCheck(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showCheck]);

  const handleAdd = async () => {
    if (!product || !selectedVariant || unavailable) return;
    setIsAdding(true);
    try {
      await addToCart(selectedVariant.id, 1, variantSnapshot(product, selectedVariant));
      setShowCheck(true);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || isTogglingWishlist) return;
    setIsTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-[1200px] px-6 pt-32">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-[4/5] animate-pulse bg-card" />
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
      <main className="mx-auto max-w-[1200px] px-6 pt-28 pb-16">
        <div className="grid gap-10 md:grid-cols-[1fr_0.9fr]">
          {/* Product Images & Multi-Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-[4/5] overflow-hidden border border-border bg-card">
              <ProductImage src={activeImage} alt={product.name} priority sizes="50vw" />
            </div>

            {/* Multi-Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden border transition-all duration-200 bg-black/40 ${
                      activeImageIndex === idx ? "border-gold ring-1 ring-gold shadow-[0_0_10px_rgba(197,160,89,0.3)]" : "border-border/60 hover:border-gold/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <ProductImage src={imgUrl} alt={`${product.name} view ${idx + 1}`} sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="flex flex-col justify-center">
            {product.brand && <p className="text-xs tracking-[0.25em] text-gold/80 uppercase mb-3">{product.brand}</p>}
            <h1 className="font-serif text-4xl text-white mb-4">{product.name}</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">{product.description || "Premium eyewear crafted for everyday clarity and presence."}</p>

            <div className="mb-8">
              <p className="mb-3 text-xs tracking-[0.2em] uppercase text-muted-foreground">Variant</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={variant.stock < 1}
                    className={`border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                      selectedVariantId === variant.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                    }`}
                  >
                    <span className="block text-sm text-white">{variant.color || variant.sku}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{variant.lensType || variant.material || "Standard lens"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-row items-center gap-5">
              <span className="font-serif text-3xl text-gold tabular-nums">{formatPrice(selectedVariant?.price || product.startingPrice)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleWishlist}
                  disabled={isTogglingWishlist}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="p-3 border border-border hover:border-accent-pink/60 hover:bg-accent-pink/5 transition-all duration-200 disabled:opacity-50"
                >
                  {isTogglingWishlist ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Heart
                      className={`size-5 transition-colors ${
                        wishlisted ? "fill-accent-pink text-accent-pink" : "text-muted-foreground/70 hover:text-accent-pink"
                      }`}
                    />
                  )}
                </button>
                {/* Main Add to Cart Button */}
                <button
                  onClick={handleAdd}
                  disabled={unavailable || isAdding}
                  className="relative inline-flex items-center justify-center gap-2 bg-gold px-8 py-3.5 text-xs font-bold tracking-[0.2em] text-background transition-all duration-300 hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-45 overflow-hidden min-w-[160px]"
                >
                  <span className={`inline-flex items-center gap-2 transition-all duration-300 ${showCheck ? "opacity-0 scale-0 w-0 overflow-hidden" : "opacity-100 scale-100"}`}>
                    <ShoppingCart className="size-4" />
                    {unavailable ? "UNAVAILABLE" : "ADD TO CART"}
                  </span>
                  <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${showCheck ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}>
                    <Check className="size-5 stroke-[2.5]" />
                    <span>ADDED</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Quick actions row */}
            {cartItem && (
              <div className="mt-6 pt-4 border-t border-border/40">
                <p className="text-xs text-muted-foreground tracking-wide">
                  {cartItem.quantity} in cart
                  <button
                    onClick={() => addToCart(selectedVariant!.id, 1, variantSnapshot(product, selectedVariant!))}
                    className="ml-3 inline-flex items-center gap-1 text-gold hover:text-gold-soft transition-colors text-xs"
                  >
                    <Plus className="size-3 stroke-[2.5]" />
                    Add more
                  </button>
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
