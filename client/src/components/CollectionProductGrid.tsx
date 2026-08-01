"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ApiProduct, fetchProductsApi } from "@/services/products";

const ITEMS_PER_PAGE = 24;

interface CollectionProductGridProps {
  collection: string;
}

export default function CollectionProductGrid({ collection }: CollectionProductGridProps) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Determine query parameters based on collection slug
  const collectionQueryParam = useMemo(() => {
    switch (collection.toLowerCase()) {
      case "sunglasses":
        return "category=sunglasses";
      case "optical-frames":
        return "category=optical-frames";
      case "limited-edition":
        return "search=gucci"; // Limited edition spotlights luxury designer frames
      default:
        return `collection=${collection}`;
    }
  }, [collection]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    let queryParams = `?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
    if (collectionQueryParam) {
      queryParams += `&${collectionQueryParam}`;
    }
    if (searchQuery.trim()) {
      queryParams += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }

    fetchProductsApi(queryParams)
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products || []);
          setTotalProducts(data.total || data.products.length);
          setTotalPages(data.pages || Math.ceil((data.total || data.products.length) / ITEMS_PER_PAGE));
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [collectionQueryParam, currentPage, searchQuery]);

  // Client-side sorting
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-low") {
      list.sort((a, b) => (Number(a.startingPrice) || 0) - (Number(b.startingPrice) || 0));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => (Number(b.startingPrice) || 0) - (Number(a.startingPrice) || 0));
    } else if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      {/* Top Bar: Search + Item Count + Sort Options */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-card/40 border border-border/60 p-4 rounded-xl backdrop-blur-sm">
        {/* Search Input within Collection */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search within ${collection.replace("-", " ")}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-background border border-border/80 rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Product Count & Sort Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-gold" /> Loading...
              </span>
            ) : (
              <span>
                {totalProducts} Product{totalProducts !== 1 ? "s" : ""} Found
              </span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-widest hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-gold cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[360px] border border-border bg-card/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-border/60 border-dashed py-20 text-center rounded-xl bg-card/20">
          <h3 className="font-serif text-xl text-white mb-2">Unable to load collection</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="border border-border/60 border-dashed py-20 text-center rounded-xl bg-card/20">
          <h3 className="font-serif text-xl text-white mb-2">No products found</h3>
          <p className="text-sm text-muted-foreground">Try clearing your search query or check back later.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-lg border border-border/80 bg-card/50 text-foreground hover:border-gold disabled:opacity-30 disabled:hover:border-border/80 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                // Only show current, first, last, and adjacent pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - currentPage) <= 2
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[40px] h-[40px] px-3 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-gold text-black shadow-lg shadow-gold/20"
                          : "border border-border/80 bg-card/50 text-muted-foreground hover:border-gold hover:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === 2 && currentPage > 4) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 3)
                ) {
                  return <span key={pageNum} className="text-muted-foreground text-xs px-1">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-lg border border-border/80 bg-card/50 text-foreground hover:border-gold disabled:opacity-30 disabled:hover:border-border/80 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
