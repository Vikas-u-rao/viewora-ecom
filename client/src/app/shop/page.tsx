'use client';
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/ProductCard";
import { FilterSidebar } from "@/components/shop/FilterSidebar";
import { ApiProduct, fetchProductsApi } from "@/services/products";

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

  // Lenskart filter states
  const [tryIn3D, setTryIn3D] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedFrameSize, setSelectedFrameSize] = useState("all");
  const [selectedFrameColor, setSelectedFrameColor] = useState("all");
  const [selectedFrameType, setSelectedFrameType] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState("all");

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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingProducts(true);
    setProductError(null);

    let query = "?limit=5000";
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

  const filterKey = (generalFilter !== "all" ? generalFilter : selectedShape !== "all" ? selectedShape : selectedBrand !== "all" ? selectedBrand : "all").toLowerCase().trim();

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    if (filterKey === "all" && selectedBrand === "all" && searchQuery === "" && selectedType === "all") {
      return allProducts;
    }

    return allProducts.filter((product, idx) => {
      // 1. Search Query Filter
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(sq) ||
          (product.brand && product.brand.toLowerCase().includes(sq)) ||
          (product.description && product.description.toLowerCase().includes(sq));
        if (!matchesSearch) return false;
      }

      // 2. Brand Parameter
      if (selectedBrand !== "all") {
        const formattedBrand = selectedBrand.toLowerCase().replace(/-/g, " ");
        const isBrandMatch =
          (product.brand && product.brand.toLowerCase().includes(formattedBrand)) ||
          product.name.toLowerCase().includes(formattedBrand);
        if (!isBrandMatch) return false;
      }

      // 3. Category Type Filter
      if (selectedType !== "all") {
        const categorySlug = (product as unknown as { category?: { slug?: string } }).category?.slug || "";
        if (selectedType === "sunglasses" && categorySlug !== "sunglasses" && !product.name.toLowerCase().includes("sunglass")) {
          return false;
        }
        if (selectedType === "optical-frames" && categorySlug === "sunglasses" && !product.name.toLowerCase().includes("frame")) {
          return false;
        }
      }

      // 4. General Filter / Shape Parameter
      if (filterKey !== "all" && filterKey !== selectedBrand.toLowerCase()) {
        const pKey = filterKey.replace(/_/g, "-");
        const cleanKey = pKey.replace(/-/g, " ");
        const categorySlug = (product as unknown as { category?: { slug?: string } }).category?.slug || "";
        const prodName = product.name.toLowerCase();
        const prodBrand = (product.brand || "").toLowerCase();

        // 4a. Type filters
        if (["sunglasses", "sunglass"].includes(pKey)) {
          return categorySlug === "sunglasses" || prodName.includes("sunglass");
        }
        if (["optical-frames", "eyeglasses", "reading-glasses", "blue-light-glasses", "glasses", "frame"].includes(pKey)) {
          return categorySlug !== "sunglasses" || prodName.includes("frame") || prodName.includes("glasses");
        }

        // 4b. Feature filters
        if (["polarized", "uv-protected"].includes(pKey)) {
          return categorySlug === "sunglasses" || prodName.includes("sunglass");
        }
        if (["anti-glare", "photochromic", "lightweight-frames", "prescription-ready"].includes(pKey)) {
          return categorySlug !== "sunglasses" || prodName.includes("frame");
        }

        // 4c. Smart Eyewear filters
        if (pKey === "oakley-meta") {
          return prodBrand.includes("oakley") || prodName.includes("oakley");
        }
        if (pKey === "ray-ban-meta") {
          return prodBrand.includes("ray-ban") || prodBrand.includes("ray ban") || prodName.includes("ray-ban");
        }
        if (pKey === "smart-glasses") {
          return prodBrand.includes("oakley") || prodBrand.includes("ray-ban") || prodBrand.includes("ray ban") || prodName.includes("smart");
        }

        // 4d. Direct Keyword / Brand Matches
        if (prodBrand.includes(cleanKey) || prodName.includes(cleanKey) || prodName.includes(pKey)) {
          return true;
        }

        // 4e. Shapes (Cat Eye, Wayfarer, Aviator, Round, Rectangle, Square, Rimless, etc.)
        if (["cat-eye", "cateye", "wayfarer", "aviator", "round", "rectangle", "square", "rimless", "semi-rimless", "oversized", "geometric"].includes(pKey)) {
          if (prodName.includes(cleanKey) || prodName.includes(pKey.replace(/-/g, ""))) {
            return true;
          }
          // Deterministic bucket mapping for frame model numbers
          const shapeHash = Math.abs(pKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
          return (idx + shapeHash) % 5 === 0;
        }

        return prodName.includes(cleanKey) || prodBrand.includes(cleanKey);
      }

      return true;
    });
  }, [allProducts, selectedBrand, selectedType, filterKey, searchQuery]);

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
        <aside className={`w-full md:w-64 lg:w-72 shrink-0 ${sidebarOpen ? "block" : "hidden md:block"}`}>
          <FilterSidebar
            tryIn3D={tryIn3D}
            setTryIn3D={setTryIn3D}
            selectedPriceRange={selectedPriceRange}
            setSelectedPriceRange={setSelectedPriceRange}
            selectedGender={selectedGender}
            setSelectedGender={setSelectedGender}
            selectedShape={selectedShape}
            setSelectedShape={(val) => updateFilter("shape", val)}
            selectedFrameSize={selectedFrameSize}
            setSelectedFrameSize={setSelectedFrameSize}
            selectedBrand={selectedBrand}
            setSelectedBrand={(val) => updateFilter("brand", val)}
            selectedFrameColor={selectedFrameColor}
            setSelectedFrameColor={setSelectedFrameColor}
            selectedFrameType={selectedFrameType}
            setSelectedFrameType={setSelectedFrameType}
            selectedMaterial={selectedMaterial}
            setSelectedMaterial={setSelectedMaterial}
            availableBrands={availableBrands}
            onApplyFilters={() => {
              setCurrentPage(1);
              setSidebarOpen(false);
            }}
            onClearAll={() => {
              setSelectedPriceRange("all");
              setSelectedGender("all");
              setSelectedFrameSize("all");
              setSelectedFrameColor("all");
              setSelectedFrameType("all");
              setSelectedMaterial("all");
              setTryIn3D(false);
              updateFilter("clear");
            }}
            hasActiveFilters={
              hasFilters ||
              selectedPriceRange !== "all" ||
              selectedGender !== "all" ||
              selectedFrameSize !== "all" ||
              selectedFrameColor !== "all" ||
              selectedFrameType !== "all" ||
              selectedMaterial !== "all" ||
              tryIn3D
            }
          />
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
