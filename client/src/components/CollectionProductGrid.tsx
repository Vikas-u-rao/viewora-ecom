"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { ApiProduct, fetchProductsApi } from "@/services/products";

export default function CollectionProductGrid({ collection }: { collection: string }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchProductsApi(`?collection=${collection}&limit=24`)
      .then(async (data) => {
        if (data.products.length > 0) return data;
        return fetchProductsApi("?limit=24");
      })
      .then((data) => {
        if (!cancelled) setProducts(data.products);
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
  }, [collection]);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[360px] border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-border border-dashed py-16 text-center">
        <h3 className="font-serif text-xl text-white mb-2">Products could not load</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
