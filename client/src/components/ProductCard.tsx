"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ApiProduct, variantSnapshot } from "@/services/products";
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

export default function ProductCard({ product }: { product: ApiProduct }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const variant = product.variants.find((item) => item.stock > 0) || product.variants[0];

  const fallbackImgs = [p1, p2, p3, p4];
  const slugHash = Array.from(product.slug || "").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const fallback = fallbackImgs[slugHash % fallbackImgs.length];

  const firstUrl = Array.isArray(product.defaultImageUrls) ? product.defaultImageUrls[0] : null;
  const image = firstUrl || fallback;
  const unavailable = !variant || variant.stock < 1;
  const wishlisted = isWishlisted(product.id);

  const handleAdd = async () => {
    if (!variant || unavailable) return;
    setIsAdding(true);
    try {
      await addToCart(variant.id, 1, variantSnapshot(product, variant));
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTogglingWishlist) return;
    setIsTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="group border border-border p-4 hover:border-gold transition-colors duration-300 relative">
      {/* Product image with wishlist button */}
      <div className="relative mb-4">
        <Link
          href={`/products/${product.slug}`}
          className="aspect-square overflow-hidden relative block w-full h-[260px] bg-black/20"
        >
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="size-10 text-muted-foreground" strokeWidth={1.2} />
            </div>
          )}
        </Link>

        {/* Wishlist toggle */}
        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          disabled={isTogglingWishlist}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:border-gold transition-all duration-200 disabled:opacity-50"
        >
          <Heart
            className={`size-4 transition-colors duration-200 ${
              wishlisted ? "fill-gold text-gold" : "text-muted-foreground hover:text-gold"
            }`}
          />
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
        <span className="text-gold text-lg tabular-nums">
          {formatPrice(variant?.price || product.startingPrice)}
        </span>
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
