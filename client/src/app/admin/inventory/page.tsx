"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Loader2, Package, Plus, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { getApiBaseUrl } from "@/lib/constants";

export default function InventoryPage() {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { products, fetchLoading, productsPage, productsTotalPages, setProductsPage } =
    useDashboardData(accessToken, searchQuery);

  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingStock, setEditingStock] = useState<Record<string, number | undefined>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State for Add New Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryName: "Eyewear",
    description: "",
    imageUrl: "",
    price: "",
    sku: "",
    color: "",
    size: "",
    stock: "10",
  });

  const apiUrl = getApiBaseUrl();

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setProductsPage(1);
  };

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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.stock) {
      setCreateError("Please fill in Product Name, Price, and Stock.");
      return;
    }

    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch(`${apiUrl}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          categoryName: formData.categoryName,
          description: formData.description,
          imageUrl: formData.imageUrl,
          price: Number(formData.price),
          startingPrice: Number(formData.price),
          sku: formData.sku || undefined,
          color: formData.color || undefined,
          size: formData.size || undefined,
          stock: Number(formData.stock),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      // Reset modal and trigger refresh
      setIsModalOpen(false);
      setFormData({
        name: "",
        brand: "",
        categoryName: "Eyewear",
        description: "",
        imageUrl: "",
        price: "",
        sku: "",
        color: "",
        size: "",
        stock: "10",
      });

      // Refresh current page products
      window.location.reload();
    } catch (err: any) {
      setCreateError(err.message || "Error creating product");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Catalog & Stock Controller
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage product inventory, variants, and stock levels
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-150">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by Name, Brand, or SKU..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
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

                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/40">
                  <table className="min-w-[760px] w-full table-fixed border-collapse text-left text-xs">
                    <colgroup>
                      <col className="w-[180px]" />
                      <col className="w-[270px]" />
                      <col className="w-[120px]" />
                      <col className="w-[120px]" />
                      <col className="w-[190px]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-[0.16em]">
                        <th className="px-3 py-3 text-left">SKU</th>
                        <th className="px-3 py-3 text-left">Color & Size</th>
                        <th className="px-3 py-3 text-right">Base Price</th>
                        <th className="px-3 py-3 text-center">Current Stock</th>
                        <th className="px-3 py-3 text-right">Adjust Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {p.variants.map((v) => {
                        const detailItems = [
                          ...(v.size ? [{ label: "Size", value: v.size }] : []),
                          ...(v.material ? [{ label: "Material", value: v.material }] : []),
                          ...(v.color ? [{ label: "Color", value: v.color }] : []),
                          ...(v.lensType ? [{ label: "Lens", value: v.lensType }] : []),
                        ];

                        return (
                          <tr key={v.id} className="align-middle hover:bg-white/70 transition-colors">
                            <td className="px-3 py-3 align-middle">
                              <div className="max-w-[160px] rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                                <p className="font-mono text-[11px] font-semibold leading-5 text-gray-900 break-words">
                                  {v.sku}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <div className="flex flex-col gap-1.5">
                                {detailItems.length > 0 ? (
                                  detailItems.map(({ label, value }) => (
                                    <div
                                      key={label}
                                      className="flex items-start gap-2 rounded-lg bg-white px-2.5 py-1.5 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
                                    >
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                                        {label}
                                      </span>
                                      <span className="text-sm leading-5 text-gray-700">
                                        {value}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-lg bg-white px-2.5 py-1.5 text-sm text-gray-600 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                                    No variant details
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle text-right">
                              <div className="text-base font-semibold text-gray-900">
                                ₹{Number(v.price).toLocaleString("en-IN")}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle text-center">
                              <span
                                className={`inline-flex min-w-[74px] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  v.stock <= 2
                                    ? "bg-red-50 text-red-600"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {v.stock <= 2 ? `${v.stock} • Low` : v.stock}
                              </span>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <div className="flex justify-end">
                                <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
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
                                    className="w-16 border-0 bg-transparent px-1 py-1 text-center text-xs font-semibold text-gray-800 outline-none"
                                  />
                                  <button
                                    onClick={() => handleUpdateStock(v.id)}
                                    disabled={
                                      actionLoading === v.id ||
                                      editingStock[v.id] === undefined
                                    }
                                    className="rounded-lg bg-gray-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {actionLoading === v.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      "Update"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Add New Product</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Wayfarer Frame"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Viewora"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eyewear / Sunglasses"
                    value={formData.categoryName}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryName: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief details about material, style, UV protection..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                />
              </div>

              <div className="pt-2 border-t font-semibold text-gray-900">
                Initial Variant Details
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="1999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">SKU</label>
                  <input
                    type="text"
                    placeholder="AUTO-SKU"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="Matte Black"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Size</label>
                  <input
                    type="text"
                    placeholder="Medium"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="size-4 animate-spin" /> : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
