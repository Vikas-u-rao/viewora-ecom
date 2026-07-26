"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Loader2, Package, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { getApiBaseUrl } from "@/lib/constants";

export default function InventoryPage() {
  const { accessToken } = useAuth();
  const { products, fetchLoading, productsPage, productsTotalPages, setProductsPage } =
    useDashboardData(accessToken);

  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingStock, setEditingStock] = useState<Record<string, number | undefined>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiUrl = getApiBaseUrl();

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(q));
    const matchesLowStock = !lowStockOnly || p.variants.some((v) => v.stock <= 2);
    return matchesSearch && matchesLowStock;
  });

  const handleUpdateStock = async (variantId: string) => {
    const stockVal = editingStock[variantId];
    if (stockVal === undefined || stockVal < 0) return;
    setActionLoading(variantId);
    try {
      const res = await fetch(`${apiUrl}/variants/${variantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ stock: Number(stockVal) }),
      });
      if (!res.ok) throw new Error("Failed to update stock");
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Catalog & Stock Controller
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage product inventory, variants, and stock levels
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by Name, Brand, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800 transition-colors"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-gray-350 text-gray-900 focus:ring-gray-900 h-4 w-4"
            />
            Low Stock Only
          </label>
        </div>

        {fetchLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-150 rounded-xl space-y-2">
            <Package className="size-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-gray-700">No Products Found</h4>
            <p className="text-xs text-gray-400">Try modifying your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="border border-gray-200 p-5 rounded-2xl bg-white hover:border-gray-350 transition-colors"
              >
                <div className="mb-4">
                  {p.brand && (
                    <span className="text-[10px] tracking-wider text-gray-500 font-bold uppercase">
                      {p.brand}
                    </span>
                  )}
                  <h3 className="text-base text-gray-900 font-bold">{p.name}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-500 font-semibold uppercase tracking-wider">
                        <th className="pb-2">SKU</th>
                        <th className="pb-2">Color & Size</th>
                        <th className="pb-2">Base Price</th>
                        <th className="pb-2">Current Stock</th>
                        <th className="pb-2 text-right">Adjust Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {p.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 font-mono text-[11px] font-bold text-gray-900">
                            {v.sku}
                          </td>
                          <td className="py-3">
                            {v.color || "-"} {v.size ? `(${v.size})` : ""}
                          </td>
                          <td className="py-3">
                            ₹{Number(v.price).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 font-bold">
                            {v.stock <= 2 ? (
                              <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                {v.stock} (Low)
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {v.stock}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                placeholder="Qty"
                                value={editingStock[v.id] ?? ""}
                                onChange={(e) =>
                                  setEditingStock({
                                    ...editingStock,
                                    [v.id]:
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value),
                                  })
                                }
                                className="w-16 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs text-gray-800 focus:border-gray-900 outline-none text-center"
                              />
                              <button
                                onClick={() => handleUpdateStock(v.id)}
                                disabled={
                                  actionLoading === v.id ||
                                  editingStock[v.id] === undefined
                                }
                                className="bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {actionLoading === v.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  "Update"
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {productsTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={() => setProductsPage(Math.max(1, productsPage - 1))}
              disabled={productsPage === 1}
              className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              PREVIOUS
            </button>
            <span className="text-xs text-gray-500 font-semibold">
              Page <strong className="text-gray-900">{productsPage}</strong> of{" "}
              {productsTotalPages}
            </span>
            <button
              onClick={() =>
                setProductsPage(Math.min(productsTotalPages, productsPage + 1))
              }
              disabled={productsPage === productsTotalPages}
              className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-4.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
