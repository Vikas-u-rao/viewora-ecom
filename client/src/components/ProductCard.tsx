"use client";


import Image from "next/image";
import Link from "next/link";
import { Loader2, Package } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ApiProduct, variantSnapshot } from "@/services/products";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductCard({ product }: { product: ApiProduct }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const variant = product.variants.find((item) => item.stock > 0) || product.variants[0];


  // Local fallback images from assets
  const fallbackImgs = [p1, p2, p3, p4];
  const slugHash = Array.from(product.slug || "").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const fallback = fallbackImgs[slugHash % fallbackImgs.length];

  const rawUrls = product.defaultImageUrls;
  const firstUrl = Array.isArray(rawUrls)
    ? rawUrls[0]
    : (typeof rawUrls === "string" ? rawUrls.split(/\s+/)[0] : null);
  const image = firstUrl || fallback;
  const unavailable = !variant || variant.stock < 1;

  const handleAdd = async () => {
    if (!variant || unavailable) return;
    setIsAdding(true);
    try {
      await addToCart(variant.id, 1, variantSnapshot(product, variant));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="border border-border p-4 hover:border-gold transition-colors duration-300">
      <Link
        href={`/products/${product.slug}`}
        className="aspect-square overflow-hidden mb-4 relative block w-full h-[260px] bg-black/20"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-10 text-muted-foreground" strokeWidth={1.2} />
          </div>
        )}
      </Link>
      {product.brand && (
        <p className="mb-1 text-[10px] tracking-[0.2em] uppercase text-gold">{product.brand}</p>
      )}
      <Link href={`/products/${product.slug}`} className="block">
        <h3 className="text-lg font-serif mb-3 text-white line-clamp-1 hover:text-gold transition-colors">{product.name}</h3>
      </Link>
      <div className="flex items-center justify-between gap-3">
        <span className="text-gold text-lg tabular-nums">{formatPrice(variant?.price || product.startingPrice)}</span>
        <button
          onClick={handleAdd}
          disabled={unavailable || isAdding}
          className="min-w-20 border border-gold text-gold px-4 py-1.5 text-xs font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAdding ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : unavailable ? "SOLD" : "ADD"}
        </button>
      </div>
    </div>
  );
}
