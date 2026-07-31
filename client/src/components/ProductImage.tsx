"use client";

import Image, { StaticImageData } from "next/image";
import { ImageOff } from "lucide-react";
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
  const [error, setError] = useState(false);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-[#ffffff] ${className}`}
    >
      {src && !error ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={typeof src === "string" ? src : src.src}
          alt={alt}
          className={`w-full h-full object-contain p-3 transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex flex-col h-full items-center justify-center text-gray-400 space-y-1">
          <ImageOff className="size-8 text-gray-300" strokeWidth={1.5} />
          <span className="text-[10px] font-medium tracking-wide uppercase text-gray-400">No Image</span>
        </div>
      )}

      {!loaded && !error && src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-6 border border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
