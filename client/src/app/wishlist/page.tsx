"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, Trash2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { variantSnapshot } from "@/services/products";
import { WishlistItem } from "@/services/wishlist";
import ProductImage from "@/components/ProductImage";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function WishlistItemCard({ item, onRemove }: { item: WishlistItem; onRemove: (id: string) => void }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const product = item.product;
  if (!product || !product.variants) {
    return null;
  }
  const variant = product.variants.find((v) => v.stock > 0) || product.variants[0];

  const firstUrl = Array.isArray(product.defaultImageUrls) ? product.defaultImageUrls[0] : null;
  const image = firstUrl || "";
  const unavailable = !variant || variant.stock < 1;

  const handleAdd = async () => {
    if (!variant || unavailable) return;
    setIsAdding(true);
    try {
      await addToCart(variant.id, 1, variantSnapshot(
        { id: product.id, name: product.name, slug: product.slug, brand: product.brand, description: product.description, defaultImageUrls: product.defaultImageUrls, startingPrice: product.startingPrice, variants: product.variants },
        variant,
      ));
      setIsAdded(true);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="group border border-border p-3 hover:border-gold/60 transition-all duration-400 relative flex flex-col">
      <div className="relative mb-3">
        <Link href={`/products/${product.slug}`} className="block w-full aspect-[4/5] overflow-hidden bg-card">
          <ProductImage src={image} alt={product.name} />
        </Link>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/60 hover:border-red-500/60 hover:text-red-500 hover:bg-background/80 transition-all duration-200 disabled:opacity-50"
          aria-label="Remove from wishlist"
        >
          {isRemoving ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
        {unavailable && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="text-[9px] tracking-[0.15em] uppercase font-bold bg-background/80 backdrop-blur-sm border border-border/60 text-muted-foreground px-2 py-0.5">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {product.brand && (
        <p className="mb-0.5 text-[10px] tracking-[0.2em] uppercase text-gold/80">{product.brand}</p>
      )}
      <Link href={`/products/${product.slug}`} className="block flex-1">
        <h3 className="text-base font-serif mb-2 text-white/90 line-clamp-1 hover:text-gold transition-colors leading-snug">
          {product.name}
        </h3>
      </Link>
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border/40">
        <span className="text-gold text-sm tabular-nums tracking-wide">{formatPrice(variant?.price || product.startingPrice)}</span>
        <button
          onClick={handleAdd}
          disabled={unavailable || isAdding}
          className="relative inline-flex items-center justify-center border border-gold/70 text-gold w-[72px] h-[30px] text-[10px] font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 overflow-hidden"
        >
          {isAdding ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : unavailable ? (
            <span className="text-[10px] font-bold tracking-[0.15em]">SOLD</span>
          ) : (
            <span className="relative inline-flex items-center justify-center w-full h-full">
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  isAdded ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
              >
                <span className="text-base leading-none font-light">+</span>
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  isAdded ? "opacity-0 scale-0" : "opacity-100 scale-100"
                }`}
              >
                ADD
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, isLoading: wishlistLoading, removeFromWishlist } = useWishlist();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const handleRemove = async (itemId: string) => {
    await removeFromWishlist(itemId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex items-center justify-center pt-32">
          <Loader2 className="size-8 animate-spin text-gold" />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />
      <main className="flex-1 pt-32">
        <div className="text-center mb-10 px-6">
          <p className="text-gold tracking-[0.3em] text-xs mb-3 font-medium">VIEWORA</p>
          <h1 className="font-serif text-4xl text-white">Your Wishlist</h1>
          <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 pb-16">
          {wishlistLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[380px] border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 border border-border border-dashed">
              <Heart className="mx-auto mb-4 size-12 text-muted-foreground" strokeWidth={1.2} />
              <h3 className="text-xl font-serif text-white mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground text-sm font-sans mb-6">Save your favourite frames for later.</p>
              <Link
                href="/shop"
                className="inline-flex bg-gold text-background px-6 py-2.5 text-xs font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors"
              >
                EXPLORE COLLECTION
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6 tracking-wide">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <WishlistItemCard key={item.id} item={item} onRemove={handleRemove} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
