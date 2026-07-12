"use client";

import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ApiProduct, variantSnapshot } from "@/services/products";
import ProductImage from "@/components/ProductImage";
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
  const [isAdded, setIsAdded] = useState(false);
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
      setIsAdded(true);
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
    <div className="group border border-border p-3 hover:border-gold/60 transition-all duration-400 relative flex flex-col">
      {/* Product image with wishlist button */}
      <div className="relative mb-3">
        <Link
          href={`/products/${product.slug}`}
          className="block w-full aspect-[4/5] overflow-hidden bg-card"
        >
          <ProductImage src={image} alt={product.name} priority={false} />
        </Link>

        {/* Wishlist toggle */}
        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          disabled={isTogglingWishlist}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/60 hover:border-gold/60 hover:bg-background/80 transition-all duration-200 disabled:opacity-50"
        >
          <Heart
            className={`size-3.5 transition-colors duration-200 ${
              wishlisted ? "fill-gold text-gold" : "text-muted-foreground/70 hover:text-gold"
            }`}
          />
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
        <span className="text-gold text-sm tabular-nums tracking-wide">
          {formatPrice(variant?.price || product.startingPrice)}
        </span>
        <button
          onClick={handleAdd}
          disabled={unavailable || isAdding}
          className="relative inline-flex items-center justify-center border border-gold/70 text-gold w-[72px] h-[30px] text-[10px] font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40 overflow-hidden"
        >
          {isAdding ? (
            <Loader2 className="size-3.5 animate-spin" />
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
