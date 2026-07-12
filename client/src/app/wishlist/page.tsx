"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, Package, Trash2 } from "lucide-react";
import Header from "@/components/header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { variantSnapshot } from "@/services/products";
import { WishlistItem } from "@/services/wishlist";

import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.png";
import p4 from "@/assets/p4.png";

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
  const [isRemoving, setIsRemoving] = useState(false);

  const product = item.product;
  const variant = product.variants.find((v) => v.stock > 0) || product.variants[0];

  const fallbackImgs = [p1, p2, p3, p4];
  const slugHash = Array.from(product.slug || "").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const fallback = fallbackImgs[slugHash % fallbackImgs.length];
  const firstUrl = Array.isArray(product.defaultImageUrls) ? product.defaultImageUrls[0] : null;
  const image = firstUrl || fallback;
  const unavailable = !variant || variant.stock < 1;

  const handleAdd = async () => {
    if (!variant || unavailable) return;
    setIsAdding(true);
    try {
      await addToCart(variant.id, 1, variantSnapshot(
        { id: product.id, name: product.name, slug: product.slug, brand: product.brand, description: product.description, defaultImageUrls: product.defaultImageUrls, startingPrice: product.startingPrice, variants: product.variants },
        variant,
      ));
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
    <div className="group border border-border p-4 hover:border-gold transition-colors duration-300 relative">
      <div className="relative mb-4">
        <Link href={`/products/${product.slug}`} className="aspect-square overflow-hidden relative block w-full h-[260px] bg-black/20">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="size-10 text-muted-foreground" strokeWidth={1.2} />
            </div>
          )}
        </Link>
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:border-red-500 hover:text-red-500 transition-all duration-200 disabled:opacity-50"
          aria-label="Remove from wishlist"
        >
          {isRemoving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </button>
      </div>

      {product.brand && (
        <p className="mb-1 text-[10px] tracking-[0.2em] uppercase text-gold">{product.brand}</p>
      )}
      <Link href={`/products/${product.slug}`} className="block">
        <h3 className="text-lg font-serif mb-3 text-white line-clamp-1 hover:text-gold transition-colors">
          {product.name}
        </h3>
      </Link>
      <div className="flex items-center justify-between gap-3">
        <span className="text-gold text-lg tabular-nums">{formatPrice(variant?.price || product.startingPrice)}</span>
        <button
          onClick={handleAdd}
          disabled={unavailable || isAdding}
          className="min-w-20 border border-gold text-gold px-4 py-1.5 text-xs font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAdding ? (
            <Loader2 className="mx-auto size-3.5 animate-spin" />
          ) : unavailable ? (
            "SOLD"
          ) : (
            "ADD"
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
      <footer className="border-t border-border py-8 text-center text-xs tracking-[0.2em] text-muted-foreground font-sans bg-background">
        (c) 2026 VIEWORA -- FASHION EYEWEAR. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
