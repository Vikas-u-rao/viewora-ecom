'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header";
import ProductCard from "@/components/ProductCard";
import { ApiProduct, fetchProductsApi } from "@/services/products";
import { collections } from "@/lib/collections";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Retrieve current filters directly from searchParams
  const selectedBrand = searchParams.get("brand") || "all";
  const selectedShape = searchParams.get("shape") || "all";
  const generalFilter = searchParams.get("filter") || "all";
  const selectedCollection = searchParams.get("collection") || "all";

  // Classify type filter from the general filter
  let selectedType = "all";
  let activeShape = selectedShape;

  if (generalFilter !== "all") {
    if (["sunglasses", "optical-frames", "reading-glasses", "blue-light-glasses"].includes(generalFilter)) {
      selectedType = generalFilter;
    } else {
      activeShape = generalFilter;
    }
  }

  // Update URL Search Parameters
  const updateFilter = (type: "brand" | "shape" | "type" | "clear", value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "clear") {
      params.delete("brand");
      params.delete("shape");
      params.delete("filter");
      params.delete("collection");
    } else if (type === "brand") {
      if (value && value !== "all") {
        params.set("brand", value);
      } else {
        params.delete("brand");
      }
    } else if (type === "shape") {
      if (value && value !== "all") {
        params.set("shape", value);
        params.delete("filter"); // Clear overlapping filters
      } else {
        params.delete("shape");
      }
    } else if (type === "type") {
      if (value && value !== "all") {
        params.set("filter", value);
      } else {
        params.delete("filter");
      }
    } else if (type === "collection") {
      if (value && value !== "all") {
        params.set("collection", value);
      } else {
        params.delete("collection");
      }
    }

    router.replace(`/shop?${params.toString()}`);
  };

  useEffect(() => {
    let cancelled = false;

    setIsLoadingProducts(true);
    setProductError(null);

    fetchProductsApi("?limit=48")
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch((error: Error) => {
        if (!cancelled) setProductError(error.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Apply filters to product listing
  const filteredProducts = products.filter((product) => {
    // Collection Filter
    if (selectedCollection !== "all") {
      const col = collections.find((c) => c.slug === selectedCollection);
      if (col) {
        const isCollectionMatch = col.products.some((cp) =>
          product.name.toLowerCase().includes(cp.name.toLowerCase())
        );
        if (!isCollectionMatch) return false;
      }
    }

    // Brand Filter
    if (selectedBrand !== "all") {
      const formattedBrand = selectedBrand.toLowerCase().replace("-", " ");
      const isBrandMatch = product.name.toLowerCase().includes(formattedBrand) ||
                           product.brand?.toLowerCase().includes(formattedBrand);
      if (!isBrandMatch) return false;
    }

    // Shape Filter
    if (activeShape !== "all") {
      const formattedShape = activeShape.toLowerCase().replace("-", " ");
      const variantText = product.variants.map((variant) => `${variant.color || ""} ${variant.size || ""} ${variant.lensType || ""} ${variant.material || ""}`).join(" ").toLowerCase();
      const isShapeMatch = product.name.toLowerCase().includes(formattedShape) ||
                           variantText.includes(formattedShape) ||
                           (activeShape === "cat-eye" && product.name.toLowerCase().includes("cat-eye")) ||
                           (activeShape === "semi-rimless" && product.name.toLowerCase().includes("rimless"));
      if (!isShapeMatch) return false;
    }

    // Type Filter
    if (selectedType !== "all") {
      const haystack = `${product.name} ${product.description || ""}`.toLowerCase();
      if (selectedType === "sunglasses" && !haystack.includes("sunglass") && !haystack.includes("aviator")) {
        return false;
      }
      if (selectedType === "optical-frames" && !haystack.includes("optical") && !haystack.includes("frame") && !haystack.includes("eyeglass")) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="font-serif text-xl text-white">Filters</h2>
            {(selectedBrand !== "all" || activeShape !== "all" || selectedType !== "all" || selectedCollection !== "all") && (
              <button
                onClick={() => updateFilter("clear")}
                className="text-xs text-gold/70 hover:text-gold uppercase tracking-wider cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Collection Filter */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-gold font-medium">Collection</h3>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-start md:gap-2.5">
              {[
                { name: "All Collections", value: "all" },
                ...collections
                  .filter((c) => !["premium-sunglasses", "signature-eyewear", "luxury-eyewear", "premium-eyewear"].includes(c.slug))
                  .map((c) => ({ name: c.title, value: c.slug })),
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => updateFilter("collection", c.value)}
                  className={`text-sm tracking-wide transition-colors cursor-pointer ${
                    selectedCollection === c.value ? "text-gold font-semibold" : "text-foreground/75 hover:text-white"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-gold font-medium">Eyewear Type</h3>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-start md:gap-3">
              {[
                { name: "All Types", value: "all" },
                { name: "Sunglasses", value: "sunglasses" },
                { name: "Optical Frames", value: "optical-frames" }
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => updateFilter("type", t.value)}
                  className={`text-sm tracking-wide transition-colors cursor-pointer ${
                    selectedType === t.value ? "text-gold font-semibold" : "text-foreground/75 hover:text-white"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Shape Filter */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-gold font-medium">Frame Shape</h3>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-start md:gap-2.5">
              {[
                { name: "All Shapes", value: "all" },
                { name: "Wayfarer", value: "wayfarer" },
                { name: "Aviator", value: "aviator" },
                { name: "Cat Eye", value: "cat-eye" },
                { name: "Round", value: "round" },
                { name: "Rectangle", value: "rectangle" },
                { name: "Square", value: "square" },
                { name: "Rimless", value: "rimless" }
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateFilter("shape", s.value)}
                  className={`text-sm tracking-wide transition-colors cursor-pointer ${
                    activeShape === s.value ? "text-gold font-semibold" : "text-foreground/75 hover:text-white"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-gold font-medium">Designer Brands</h3>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-start md:gap-2.5">
              {[
                { name: "All Brands", value: "all" },
                { name: "Ray-Ban", value: "ray-ban" },
                { name: "Oakley", value: "oakley" },
                { name: "Gucci", value: "gucci" },
                { name: "Prada", value: "prada" },
                { name: "Versace", value: "versace" },
                { name: "Mont Blanc", value: "mont-blanc" },
                { name: "Maybach", value: "maybach" }
              ].map((b) => (
                <button
                  key={b.value}
                  onClick={() => updateFilter("brand", b.value)}
                  className={`text-sm tracking-wide transition-colors cursor-pointer ${
                    selectedBrand === b.value ? "text-gold font-semibold" : "text-foreground/75 hover:text-white"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground tracking-wide font-sans">
              Showing <span className="text-white font-medium">{filteredProducts.length}</span> pieces
            </p>
          </div>

          {isLoadingProducts ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-[380px] border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : productError ? (
            <div className="text-center py-20 border border-border border-dashed">
              <h3 className="text-xl font-serif text-white mb-2">Products could not load</h3>
              <p className="text-muted-foreground text-sm font-sans">{productError}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-border border-dashed">
              <h3 className="text-xl font-serif text-white mb-2">No frames found</h3>
              <p className="text-muted-foreground text-sm font-sans mb-6">Try clearing filters or checking other styles.</p>
              <button
                onClick={() => updateFilter("clear")}
                className="bg-gold text-background px-6 py-2.5 text-xs font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors cursor-pointer"
              >
                RESET FILTERS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 pt-32">
        <div className="text-center mb-10 px-6">
          <p className="text-gold tracking-[0.3em] text-xs mb-3 font-medium">VIEWORA CATALOGUE</p>
          <h1 className="font-serif text-4xl md:text-5xl text-white">Handcrafted Precision</h1>
          <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4"></div>
        </div>

        <Suspense fallback={
          <div className="text-center py-20 text-muted-foreground font-sans">
            Loading Catalog...
          </div>
        }>
          <ShopContent />
        </Suspense>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs tracking-[0.2em] text-muted-foreground font-sans bg-background">
        © 2026 VIEWORA — FASHION EYEWEAR. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
