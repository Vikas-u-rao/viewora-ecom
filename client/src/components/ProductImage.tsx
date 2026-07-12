"use client";

import Image, { StaticImageData } from "next/image";
import { Package } from "lucide-react";
import { useState } from "react";

interface ProductImageProps {
  src: string | StaticImageData;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export default function ProductImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className = "",
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-gradient-to-b from-card/80 to-card/30 ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-contain p-3 transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Package className="size-10 text-muted-foreground" strokeWidth={1.2} />
        </div>
      )}

      {!loaded && src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-6 border border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
