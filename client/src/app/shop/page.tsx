'use client';
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { ApiProduct, fetchProductsApi } from "@/services/products";

const ITEMS_PER_PAGE = 24;

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter states
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedFrameSize, setSelectedFrameSize] = useState("all");
  const [selectedFrameColor, setSelectedFrameColor] = useState("all");

  const selectedBrand = searchParams.get("brand") || "all";
  const selectedShape = searchParams.get("shape") || "all";
  const generalFilter = searchParams.get("filter") || "all";
  const selectedCollection = searchParams.get("collection") || "all";
  const searchQuery = searchParams.get("search") || "";

  const activeShape = generalFilter !== "all" ? "all" : selectedShape;

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

  // Build API query and fetch products (all filtering happens server-side)
  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingProducts(true);
    setProductError(null);

    let query = `?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
    if (selectedCollection !== "all") {
      query += `&collection=${selectedCollection}`;
    }
    if (selectedBrand !== "all") {
      query += `&brand=${encodeURIComponent(selectedBrand)}`;
    }
    if (generalFilter !== "all") {
      query += `&type=${encodeURIComponent(generalFilter)}`;
    }
    if (selectedShape !== "all") {
      query += `&shape=${encodeURIComponent(selectedShape)}`;
    }
    if (searchQuery) {
      query += `&search=${encodeURIComponent(searchQuery)}`;
    }
    if (selectedPriceRange !== "all") {
      query += `&price=${selectedPriceRange}`;
    }
    if (selectedFrameSize !== "all") {
      query += `&size=${selectedFrameSize}`;
    }
    if (selectedFrameColor !== "all") {
      query += `&color=${selectedFrameColor}`;
    }
    if (sortBy !== "newest") {
      query += `&sort=${sortBy}`;
    }

    fetchProductsApi(query)
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products);
          setTotalProducts(data.total || data.products.length);
          setAvailableBrands(data.brands || []);
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
  }, [currentPage, selectedCollection, selectedBrand, generalFilter, selectedShape, searchQuery, selectedPriceRange, selectedFrameSize, selectedFrameColor, sortBy]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE));

  const hasFilters =
    selectedBrand !== "all" ||
    activeShape !== "all" ||
    generalFilter !== "all" ||
    selectedCollection !== "all" ||
    selectedPriceRange !== "all" ||
    selectedFrameSize !== "all" ||
    selectedFrameColor !== "all";

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
        <aside className={`w-full md:w-64 lg:w-72 shrink-0 ${sidebarOpen ? "block" : "hidden md:block"}`}>
          <FilterSidebar
            selectedPriceRange={selectedPriceRange}
            setSelectedPriceRange={(val) => { setSelectedPriceRange(val); setCurrentPage(1); }}
            selectedShape={selectedShape}
            setSelectedShape={(val) => updateFilter("shape", val)}
            selectedFrameSize={selectedFrameSize}
            setSelectedFrameSize={(val) => { setSelectedFrameSize(val); setCurrentPage(1); }}
            selectedBrand={selectedBrand}
            setSelectedBrand={(val) => updateFilter("brand", val)}
            selectedFrameColor={selectedFrameColor}
            setSelectedFrameColor={(val) => { setSelectedFrameColor(val); setCurrentPage(1); }}
            availableBrands={availableBrands}
            onClearAll={() => {
              setSelectedPriceRange("all");
              setSelectedFrameSize("all");
              setSelectedFrameColor("all");
              updateFilter("clear");
            }}
            hasActiveFilters={hasFilters}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-border pb-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground tracking-wide font-sans">
                Showing <span className="text-white font-medium">{totalProducts}</span> piece{totalProducts !== 1 ? "s" : ""}
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
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 border border-border px-4 py-2 text-xs tracking-wider text-muted-foreground hover:text-white hover:border-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" /> PREV
                  </button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
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
