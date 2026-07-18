/**
 * Product detail page — skeleton loading UI.
 * Shown by Next.js while the server-renders /products/[slug].
 */
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header placeholder */}
      <div className="h-[72px] border-b border-border bg-background/90" />

      <main className="max-w-[1200px] mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image skeleton */}
          <div className="aspect-square bg-card animate-pulse rounded-sm" />

          {/* Info skeleton */}
          <div className="flex flex-col gap-4 pt-2">
            {/* Brand */}
            <div className="h-3 w-20 bg-card animate-pulse rounded" />
            {/* Product name */}
            <div className="h-8 w-3/4 bg-card animate-pulse rounded" />
            <div className="h-5 w-1/2 bg-card animate-pulse rounded" />
            {/* Price */}
            <div className="h-7 w-28 bg-card animate-pulse rounded mt-2" />
            {/* Divider */}
            <div className="h-[1px] bg-border my-2" />
            {/* Variant selector */}
            <div className="h-4 w-24 bg-card animate-pulse rounded" />
            <div className="flex gap-3 mt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-20 bg-card animate-pulse rounded-sm" />
              ))}
            </div>
            {/* Add to cart button */}
            <div className="h-12 w-full bg-card animate-pulse rounded-sm mt-4" />
          </div>
        </div>
      </main>
    </div>
  );
}
