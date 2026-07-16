'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/ProductCard";
import { ApiProduct, fetchProductsApi } from "@/services/products";
import { collections } from "@/lib/collections";

const ITEMS_PER_PAGE = 12;

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedBrand = searchParams.get("brand") || "all";
  const selectedShape = searchParams.get("shape") || "all";
  const generalFilter = searchParams.get("filter") || "all";
  const selectedCollection = searchParams.get("collection") || "all";
  const searchQuery = searchParams.get("search") || "";

  let selectedType = "all";
  let activeShape = selectedShape;

  if (generalFilter !== "all") {
    if (["sunglasses", "optical-frames", "reading-glasses", "blue-light-glasses"].includes(generalFilter)) {
      selectedType = generalFilter;
    } else {
      activeShape = generalFilter;
    }
  }

  const updateFilter = (type: "brand" | "shape" | "type" | "collection" | "clear", value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "clear") {
      params.delete("brand");
      params.delete("shape");
      params.delete("filter");
      params.delete("collection");
      params.delete("search");
    } else if (type === "brand") {
      if (value && value !== "all") {
        params.set("brand", value);
      } else {
        params.delete("brand");
      }
    } else if (type === "shape") {
      if (value && value !== "all") {
        params.set("shape", value);
        params.delete("filter");
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

    setCurrentPage(1);
    router.replace(`/shop?${params.toString()}`);
  };

  // Build API query and fetch products
  useEffect(() => {
    let cancelled = false;

    setIsLoadingProducts(true);
    setProductError(null);

    let query = "?limit=48";
    if (selectedCollection !== "all") {
      query += `&collection=${selectedCollection}`;
    }
    if (searchQuery) {
      query += `&search=${encodeURIComponent(searchQuery)}`;
    }

    fetchProductsApi(query)
      .then((data) => {
        if (!cancelled) {
          setAllProducts(data.products);
        }
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
  }, [selectedCollection, searchQuery]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allProducts.forEach((p) => {
      if (p.brand) {
        brands.add(p.brand);
      }
    });
    return Array.from(brands).sort();
  }, [allProducts]);

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Brand Filter
      if (selectedBrand !== "all") {
        const formattedBrand = selectedBrand.toLowerCase().replace(/-/g, " ");
        const isBrandMatch = product.name.toLowerCase().includes(formattedBrand) ||
                             product.brand?.toLowerCase().includes(formattedBrand);
        if (!isBrandMatch) return false;
      }

      // Shape Filter
      if (activeShape !== "all") {
        const formattedShape = activeShape.toLowerCase().replace(/-/g, " ");
        const variantText = product.variants.map((variant) => `${variant.color || ""} ${variant.size || ""} ${variant.lensType || ""} ${variant.material || ""}`).join(" ").toLowerCase();
        const isShapeMatch = product.name.toLowerCase().includes(formattedShape) ||
                             variantText.includes(formattedShape) ||
                             (activeShape === "cat-eye" && product.name.toLowerCase().includes("cat-eye")) ||
                             (activeShape === "semi-rimless" && product.name.toLowerCase().includes("rimless"));
        if (!isShapeMatch) return false;
      }

      if (selectedType !== "all") {
        const categorySlug = (product as unknown as { category?: { slug?: string } }).category?.slug || "";
        if (selectedType === "sunglasses" && categorySlug !== "sunglasses") {
          return false;
        }
        if (selectedType === "optical-frames" && !["eyeglasses", "blue-light-glasses", "reading-glasses"].includes(categorySlug)) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, selectedBrand, activeShape, selectedType]);

  // Client-side sort
  const sortedProducts = useMemo(() => {
    const arr = [...filteredProducts];
    switch (sortBy) {
      case "price-asc":
        return arr.sort((a, b) => {
          const aPrice = Math.min(...a.variants.map((v) => Number(v.price)));
          const bPrice = Math.min(...b.variants.map((v) => Number(v.price)));
          return aPrice - bPrice;
        });
      case "price-desc":
        return arr.sort((a, b) => {
          const aPrice = Math.min(...a.variants.map((v) => Number(v.price)));
          const bPrice = Math.min(...b.variants.map((v) => Number(v.price)));
          return bPrice - aPrice;
        });
      case "name-asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      default: // newest
        return arr;
    }
  }, [filteredProducts, sortBy]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = sortedProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const hasFilters = selectedBrand !== "all" || activeShape !== "all" || selectedType !== "all" || selectedCollection !== "all";

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex md:hidden items-center gap-2 text-sm text-gold tracking-wide mb-2"
        >
          <SlidersHorizontal className="size-4" />
          {sidebarOpen ? "HIDE FILTERS" : "SHOW FILTERS"}
        </button>

        {/* Filters Sidebar */}
        <aside className={`w-full md:w-60 lg:w-72 shrink-0 space-y-8 ${sidebarOpen ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="font-serif text-xl text-white">Filters</h2>
            {hasFilters && (
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
            <div className="flex flex-col gap-2.5">
              {[
                { name: "All Collections", value: "all" },
                { name: "Best Sellers", value: "best-sellers" },
                { name: "New Arrivals", value: "new-arrivals" },
                { name: "Premium Eyewear", value: "premium-eyewear" },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => updateFilter("collection", c.value)}
                  className={`text-sm tracking-wide transition-colors cursor-pointer text-left ${
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
            <div className="flex flex-col gap-3">
              {[
                { name: "All Types", value: "all" },
                { name: "Sunglasses", value: "sunglasses" },
                { name: "Optical Frames", value: "optical-frames" }
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => updateFilter("type", t.value)}
                  className={`text-sm tracking-wide transition-colors cursor-pointer text-left ${
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
            <div className="flex flex-col gap-2.5">
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
                  className={`text-sm tracking-wide transition-colors cursor-pointer text-left ${
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
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => updateFilter("brand", "all")}
                className={`text-sm tracking-wide transition-colors cursor-pointer text-left ${
                  selectedBrand === "all" ? "text-gold font-semibold" : "text-foreground/75 hover:text-white"
                }`}
              >
                All Brands
              </button>
              {availableBrands.map((brandName) => {
                const brandValue = brandName.toLowerCase().replace(/ /g, "-");
                return (
                  <button
                    key={brandName}
                    onClick={() => updateFilter("brand", brandValue)}
                    className={`text-sm tracking-wide transition-colors cursor-pointer text-left ${
                      selectedBrand === brandValue ? "text-gold font-semibold" : "text-foreground/75 hover:text-white"
                    }`}
                  >
                    {brandName}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-border pb-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground tracking-wide font-sans">
                Showing <span className="text-white font-medium">{sortedProducts.length}</span> piece{sortedProducts.length !== 1 ? "s" : ""}
              </p>
              {searchQuery && (
                <p className="text-xs text-muted-foreground font-sans">
                  Search results for: <span className="text-gold font-serif italic font-bold">&quot;{searchQuery}&quot;</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-xs uppercase tracking-widest text-muted-foreground">Sort</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="bg-transparent border border-border text-sm text-white px-3 py-1.5 focus:outline-none focus:border-gold cursor-pointer"
              >
                <option value="newest" className="bg-background">Newest</option>
                <option value="price-asc" className="bg-background">Price: Low to High</option>
                <option value="price-desc" className="bg-background">Price: High to Low</option>
                <option value="name-asc" className="bg-background">Name: A to Z</option>
                <option value="name-desc" className="bg-background">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Product Grid Loading Skeleton */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-[380px] border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : productError ? (
            <div className="text-center py-20 border border-border border-dashed">
              <h3 className="text-xl font-serif text-white mb-2">Products could not load</h3>
              <p className="text-muted-foreground text-sm font-sans">{productError}</p>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="flex items-center gap-1 border border-border px-4 py-2 text-xs tracking-wider text-muted-foreground hover:text-white hover:border-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" /> PREV
                  </button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="flex items-center gap-1 border border-border px-4 py-2 text-xs tracking-wider text-muted-foreground hover:text-white hover:border-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    NEXT <ChevronRight className="size-3.5" />
                  </button>
                </div>
              )}
            </>
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
          <h1 className="font-serif text-4xl text-white">Handcrafted Precision</h1>
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

      <Footer />
    </div>
  );
}
