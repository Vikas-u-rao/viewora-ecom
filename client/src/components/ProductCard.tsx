"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, ImageOff } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ApiProduct, variantSnapshot } from "@/services/products";
import { formatPrice } from "@/lib/format";
import { resolveImageUrl } from "@/lib/productImage";

export default function ProductCard({ product }: { product: ApiProduct }) {
  const { items, addToCart, updateQuantity, removeItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [secondImgError, setSecondImgError] = useState(false);

  const variant = product.variants.find((item) => item.stock > 0) || product.variants[0];

  const firstRaw = (Array.isArray(product.defaultImageUrls) && product.defaultImageUrls[0]) || (variant && Array.isArray(variant.imageUrls) && variant.imageUrls[0]) || null;
  const secondRaw = (Array.isArray(product.defaultImageUrls) && product.defaultImageUrls[1]) || (variant && Array.isArray(variant.imageUrls) && variant.imageUrls[1]) || null;
  const firstUrl = resolveImageUrl(firstRaw);
  const secondUrl = resolveImageUrl(secondRaw);
  const hasImage = firstUrl && !imgError;
  const hasSecondImage = Boolean(secondUrl && !secondImgError && secondUrl !== firstUrl);
  const unavailable = !variant || variant.stock < 1;
  const wishlisted = isWishlisted(product.id);

  const cartItem = variant ? items.find((i) => i.variantId === variant.id) : null;
  const inCartQty = cartItem?.quantity || 0;
  const maxReached = variant ? inCartQty >= variant.stock : false;

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem || isAdding) return;
    setIsAdding(true);
    try {
      if (cartItem.quantity > 1) {
        await updateQuantity(cartItem.id, cartItem.quantity - 1);
      } else {
        await removeItem(cartItem.id);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem || isAdding || maxReached) return;
    setIsAdding(true);
    try {
      await updateQuantity(cartItem.id, cartItem.quantity + 1);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant || unavailable || isAdding) return;
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
    <div className="group bg-[#0b0b0a] border border-transparent rounded-lg overflow-hidden hover:border-[#c9a35c] transition-colors duration-300 relative flex flex-col justify-between h-full">
      {/* Product image with wishlist button */}
      <div className="relative bg-[#ffffff] p-6 flex items-center justify-center aspect-square overflow-hidden w-full h-[260px]">
        <Link
          href={`/products/${product.slug}`}
          className="relative w-full h-full block flex flex-col items-center justify-center"
        >
          {hasImage ? (
            <>
              <Image
                src={firstUrl}
                alt={product.name}
                fill
                unoptimized
                onError={() => setImgError(true)}
                className={`object-contain transition-opacity duration-500 ease-in-out ${
                  hasSecondImage ? "group-hover:opacity-0" : ""
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {hasSecondImage && (
                <Image
                  src={secondUrl!}
                  alt={`${product.name} secondary view`}
                  fill
                  unoptimized
                  onError={() => setSecondImgError(true)}
                  className="object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
              <ImageOff className="size-8 text-gray-300" strokeWidth={1.5} />
              <span className="text-[10px] font-medium tracking-wide uppercase text-gray-400">No Image</span>
            </div>
          )}
        </Link>

        {/* Wishlist toggle */}
        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          disabled={isTogglingWishlist}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:border-accent-pink transition-all duration-200 disabled:opacity-50"
        >
          <Heart
            className={`size-3.5 transition-colors duration-200 ${
              wishlisted ? "fill-accent-pink text-accent-pink" : "text-muted-foreground/70 hover:text-accent-pink"
            }`}
          />
        </button>

        {unavailable ? (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="text-[9px] tracking-[0.15em] uppercase font-bold bg-background/80 backdrop-blur-sm border border-border/60 text-muted-foreground px-2 py-0.5">
              Sold Out
            </span>
          </div>
        ) : variant && variant.stock <= 5 ? (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="text-[9px] tracking-[0.15em] uppercase font-bold bg-amber-900/80 backdrop-blur-sm border border-amber-600/60 text-amber-300 px-2 py-0.5">
              Only {variant.stock} left
            </span>
          </div>
        ) : null}
      </div>

      {/* Info wrap */}
      <div className="bg-[#0b0b0a] px-3 py-2.5 flex-1 flex flex-col justify-between">
        <div>
          {product.brand && (
            <p className="text-[11px] text-[#c9a35c] uppercase tracking-wide mb-0.5">{product.brand}</p>
          )}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-[13px] text-[#f2f2f0] font-sans mb-1 line-clamp-1 font-medium hover:text-[#e0b96f] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-[#c9a35c] text-[13px] font-semibold tabular-nums">
            {formatPrice(variant?.price || product.startingPrice)}
          </span>
          {cartItem ? (
            <div className="flex items-center gap-2 border border-[#c9a35c] px-2 py-0.5 text-[11px] font-bold rounded-sm h-[24px]">
              <button
                onClick={handleDecrement}
                disabled={isAdding}
                className="text-[#c9a35c] hover:text-white px-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-white min-w-[14px] text-center font-bold">{cartItem.quantity}</span>
              <button
                onClick={handleIncrement}
                disabled={isAdding || maxReached}
                className="text-[#c9a35c] hover:text-white px-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
                title={maxReached ? `Only ${variant?.stock} in stock` : "Increase quantity"}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={unavailable || isAdding}
              className="min-w-20 border border-[#c9a35c] text-[#c9a35c] px-3 py-1 text-[11px] font-bold tracking-[0.1em] hover:bg-[#c9a35c] hover:text-background transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-45 rounded-sm h-[24px] flex items-center justify-center"
            >
              {isAdding ? (
                <Loader2 className="mx-auto size-3.5 animate-spin" />
              ) : unavailable ? (
                "SOLD"
              ) : (
                "ADD"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
