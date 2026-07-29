"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Loader2, Package, Plus, Search, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { getApiBaseUrl } from "@/lib/constants";

const BRAND_OPTIONS = [
  "Viewora",
  "Ray-Ban",
  "Oakley",
  "Gucci",
  "Prada",
  "Versace",
  "Persol",
  "Tom Ford",
  "Cartier",
  "Police",
  "Carrera",
  "Burberry",
  "Vogue Eyewear",
];

const CATEGORY_OPTIONS = [
  "Eyewear",
  "Sunglasses",
  "Optical Frames",
  "Reading Glasses",
  "Blue Light Glasses",
  "Smart Eyewear",
  "Contact Lenses",
  "Accessories",
];

const GENDER_OPTIONS = ["Unisex", "Men", "Women"];

const SHAPE_OPTIONS = [
  "Wayfarer",
  "Aviator",
  "Cat Eye",
  "Round",
  "Rectangle",
  "Square",
  "Geometric",
  "Oversized",
];

const SIZE_OPTIONS = ["Medium", "Small", "Large", "Wide Fit"];

const COLOR_OPTIONS = [
  "Black",
  "Gold",
  "Silver",
  "Tortoise",
  "Transparent",
  "Rose Gold",
  "Blue",
];

const FRAME_TYPE_OPTIONS = ["Full Rim", "Half Rim", "Rimless"];

const MATERIAL_OPTIONS = ["Acetate", "Titanium", "Metal", "TR90"];

export default function InventoryPage() {
  const { accessToken } = useAuth();
  const { products, fetchLoading, productsPage, productsTotalPages, setProductsPage, refreshProducts, addProduct, removeProduct } =
    useDashboardData(accessToken);

  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingStock, setEditingStock] = useState<Record<string, number | undefined>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State for Add New Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initialFormData = {
    name: "",
    brand: "Viewora",
    categoryName: "Eyewear",
    gender: "Unisex",
    shape: "Wayfarer",
    size: "Medium",
    color: "Black",
    frameType: "Full Rim",
    material: "Acetate",
    description: "",
    image1: "",
    image2: "",
    image3: "",
    image4: "",
    price: "",
    stock: "10",
    sku: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const apiUrl = getApiBaseUrl();
  const R2_CDN_BASE =
    process.env.NEXT_PUBLIC_R2_CDN_URL ||
    "https://pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev";

  const formatR2Url = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
      return trimmed;
    }
    const cleanFilename = trimmed.replace(/^\/?(uploads\/products\/)?/, "");
    return `${R2_CDN_BASE}/uploads/products/${cleanFilename}`;
  };

  const handleFileUpload = async (
    file: File,
    field: "image1" | "image2" | "image3" | "image4"
  ) => {
    setUploadingField(field);
    try {
      const body = new FormData();
      body.append("image", file);

      const res = await fetch(`${apiUrl}/admin/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload image");

      setFormData((prev) => ({
        ...prev,
        [field]: data.url,
      }));
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingField(null);
    }
  };

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

  const handleDeleteProduct = async (productId: string) => {
    setDeletingId(productId);
    try {
      const res = await fetch(`${apiUrl}/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setDeleteConfirm(null);
      removeProduct(productId);
      refreshProducts();
    } catch {
      setDeleteConfirm(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for all mandatory fields
    if (
      !formData.name.trim() ||
      !formData.brand.trim() ||
      !formData.categoryName.trim() ||
      !formData.gender.trim() ||
      !formData.shape.trim() ||
      !formData.size.trim() ||
      !formData.color.trim() ||
      !formData.frameType.trim() ||
      !formData.material.trim() ||
      !formData.description.trim() ||
      !formData.image1.trim() ||
      !formData.image2.trim() ||
      !formData.image3.trim() ||
      !formData.image4.trim() ||
      !formData.price ||
      !formData.stock ||
      !formData.sku.trim()
    ) {
      setCreateError("Please fill in ALL mandatory fields marked with *");
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
          gender: formData.gender,
          shape: formData.shape,
          frameType: formData.frameType,
          material: formData.material,
          description: formData.description,
          image1: formData.image1,
          image2: formData.image2,
          image3: formData.image3,
          image4: formData.image4,
          imageUrls: [
            formData.image1.trim(),
            formData.image2.trim(),
            formData.image3.trim(),
            formData.image4.trim(),
          ],
          price: Number(formData.price),
          startingPrice: Number(formData.price),
          sku: formData.sku.trim(),
          color: formData.color.trim(),
          size: formData.size.trim(),
          stock: Number(formData.stock),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      // Reset modal and prepend product instantly
      setIsModalOpen(false);
      setFormData(initialFormData);
      addProduct(data.product);
      refreshProducts(); // background sync
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error creating product");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 w-full max-w-full overflow-x-hidden p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 w-full">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
            Catalog &amp; Stock Controller
          </h2>
          <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
            Manage product inventory, variants, and stock levels
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg transition-all shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="size-3 sm:size-3.5" />
          <span className="hidden sm:inline">Add New Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ── Main Card ── */}
      <div className="flex-1 flex flex-col min-h-0 w-full max-w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* ── Search Bar ── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-gray-50 p-2.5 sm:p-3 rounded-t-xl border-b border-gray-200">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 sm:size-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by Name, Brand, or SKU..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-7 sm:pl-8 pr-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs focus:border-gray-900 outline-none text-gray-800 transition-colors"
            />
          </div>
          <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-gray-600 cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-gray-350 text-gray-900 focus:ring-gray-900 h-3 w-3 sm:h-3.5 sm:w-3.5"
            />
            <span className="hidden xs:inline">Low Stock Only</span>
            <span className="xs:hidden">Low</span>
          </label>
        </div>

        {/* ── Product List ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 w-full max-w-full box-border">
        {fetchLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 sm:h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 sm:py-12 border-2 border-dashed border-gray-150 rounded-xl space-y-2">
            <Package className="size-7 sm:size-8 text-gray-300 mx-auto" />
            <h4 className="text-xs sm:text-sm font-bold text-gray-700">No Products Found</h4>
            <p className="text-[11px] sm:text-xs text-gray-400">Try modifying your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-3 w-full max-w-full">
            {filteredProducts.map((p) => (
              <div key={p.id} className="border border-gray-200 rounded-xl bg-white w-full max-w-full">
                {/* ── Product Header ── */}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-gray-100">
                  <div className="min-w-0 flex-1 truncate">
                    {p.brand && (
                      <span className="text-[9px] sm:text-[10px] tracking-wider text-gray-500 font-semibold uppercase">
                        {p.brand}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{p.name}</h3>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer shrink-0 ml-2"
                    title="Delete product"
                  >
                    <Trash2 className="size-3 sm:size-3.5" />
                  </button>
                </div>

                {/* ── Variant Rows (Desktop: grid, Mobile: stacked) ── */}
                {p.variants.map((v) => {
                  const detailItems = [
                    ...(v.size ? [{ label: "Size", value: v.size }] : []),
                    ...(v.material ? [{ label: "Material", value: v.material }] : []),
                    ...(v.color ? [{ label: "Color", value: v.color }] : []),
                    ...(v.lensType ? [{ label: "Lens", value: v.lensType }] : []),
                  ];

                  return (
                    <div
                      key={v.id}
                      className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/30 transition-colors"
                    >
                      {/* Desktop: horizontal grid */}
                      <div className="hidden sm:grid sm:grid-cols-[1.5fr_2fr_0.8fr_0.8fr_1.3fr] gap-2 px-3 sm:px-4 py-2.5 items-center text-xs">
                        <div className="min-w-0">
                          <span className="font-mono text-[11px] font-semibold text-gray-900 break-all">{v.sku}</span>
                        </div>
                        <div className="min-w-0">
                          {detailItems.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {detailItems.map((item) => (
                                <span
                                  key={`${v.id}-${item.label}-${item.value}`}
                                  className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-700"
                                >
                                  <span className="font-semibold text-gray-500">{item.label}:</span>
                                  <span className="font-semibold text-gray-900">{item.value}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        <div className="text-right font-medium text-gray-900">
                          ₹{Number(v.price).toLocaleString("en-IN")}
                        </div>
                        <div className="text-center">
                          {v.stock <= 2 ? (
                            <span className="inline-flex items-center justify-center rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
                              {v.stock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              {v.stock}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            value={editingStock[v.id] ?? ""}
                            onChange={(e) =>
                              setEditingStock({
                                ...editingStock,
                                [v.id]: e.target.value === "" ? undefined : Number(e.target.value),
                              })
                            }
                            className="w-14 bg-white border border-gray-200 px-2 py-1 rounded-lg text-[11px] text-gray-800 focus:border-gray-900 outline-none text-center"
                          />
                          <button
                            onClick={() => handleUpdateStock(v.id)}
                            disabled={actionLoading === v.id || editingStock[v.id] === undefined}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {actionLoading === v.id ? <Loader2 className="size-3 animate-spin" /> : "Update"}
                          </button>
                        </div>
                      </div>

                      {/* Mobile: vertical stacked */}
                      <div className="sm:hidden space-y-2 px-3 py-3 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">SKU</span>
                          <p className="font-mono text-[11px] font-semibold text-gray-900 break-all mt-0.5">{v.sku}</p>
                        </div>
                        {detailItems.length > 0 && (
                          <div>
                            <span className="text-[10px] text-gray-500 font-semibold uppercase">Details</span>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {detailItems.map((item) => (
                                <span
                                  key={`${v.id}-${item.label}-${item.value}`}
                                  className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-700"
                                >
                                  <span className="font-semibold text-gray-500">{item.label}:</span>
                                  <span className="font-semibold text-gray-900">{item.value}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Price</span>
                          <span className="font-medium text-gray-900">₹{Number(v.price).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Stock</span>
                          {v.stock <= 2 ? (
                            <span className="inline-flex items-center justify-center rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">{v.stock}</span>
                          ) : (
                            <span className="inline-flex items-center justify-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">{v.stock}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase">Adjust Qty</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              value={editingStock[v.id] ?? ""}
                              onChange={(e) =>
                                setEditingStock({
                                  ...editingStock,
                                  [v.id]: e.target.value === "" ? undefined : Number(e.target.value),
                                })
                              }
                              className="w-14 bg-white border border-gray-200 px-2 py-1 rounded-lg text-[11px] text-gray-800 focus:border-gray-900 outline-none text-center"
                            />
                            <button
                              onClick={() => handleUpdateStock(v.id)}
                              disabled={actionLoading === v.id || editingStock[v.id] === undefined}
                              className="bg-gray-900 hover:bg-gray-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {actionLoading === v.id ? <Loader2 className="size-3 animate-spin" /> : "Update"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        </div>

        {/* ── Pagination ── */}
        {productsTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-t border-gray-200">
            <button
              onClick={() => setProductsPage(Math.max(1, productsPage - 1))}
              disabled={productsPage === 1}
              className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="text-[11px] text-gray-500 font-semibold">
              Page <strong className="text-gray-900">{productsPage}</strong> of {productsTotalPages}
            </span>
            <button
              onClick={() => setProductsPage(Math.min(productsTotalPages, productsPage + 1))}
              disabled={productsPage === productsTotalPages}
              className="border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
        </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Add New Product</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  All fields marked with <span className="text-red-500 font-bold">*</span> are mandatory.
                </p>
              </div>
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
              {/* Product Title */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Wayfarer Aviator Frame"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                />
              </div>

              {/* Brand & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      BRAND_OPTIONS.includes(formData.brand)
                        ? formData.brand
                        : formData.brand === ""
                        ? "Viewora"
                        : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setFormData({ ...formData, brand: "" });
                      } else {
                        setFormData({ ...formData, brand: e.target.value });
                      }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="custom">+ Add Custom Brand...</option>
                  </select>
                  {!BRAND_OPTIONS.includes(formData.brand) && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom brand name *"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-gray-900"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      CATEGORY_OPTIONS.includes(formData.categoryName)
                        ? formData.categoryName
                        : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setFormData({ ...formData, categoryName: "" });
                      } else {
                        setFormData({ ...formData, categoryName: e.target.value });
                      }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="custom">+ Add Custom Category...</option>
                  </select>
                  {!CATEGORY_OPTIONS.includes(formData.categoryName) && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom category name *"
                      value={formData.categoryName}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryName: e.target.value })
                      }
                      className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-gray-900"
                    />
                  )}
                </div>
              </div>

              {/* Filter Attributes Dropdowns: Gender, Shape, Size */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Shape & Style <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.shape}
                    onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {SHAPE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Frame Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {SIZE_OPTIONS.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Attributes Dropdowns: Color, Frame Type, Material */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Frame Color <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      COLOR_OPTIONS.includes(formData.color) ? formData.color : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setFormData({ ...formData, color: "" });
                      } else {
                        setFormData({ ...formData, color: e.target.value });
                      }
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {COLOR_OPTIONS.map((cl) => (
                      <option key={cl} value={cl}>
                        {cl}
                      </option>
                    ))}
                    <option value="custom">+ Custom Color...</option>
                  </select>
                  {!COLOR_OPTIONS.includes(formData.color) && (
                    <input
                      type="text"
                      required
                      placeholder="Custom color *"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-gray-900"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Frame Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.frameType}
                    onChange={(e) =>
                      setFormData({ ...formData, frameType: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {FRAME_TYPE_OPTIONS.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Material <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.material}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900 bg-white"
                  >
                    {MATERIAL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief details about material, style, UV protection..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                />
              </div>

              {/* 4 Image URLs ("take 4 make") */}
              <div className="pt-2 border-t">
                <div className="font-semibold text-gray-900 mb-2">
                  Product Image URLs (4 Mandatory Images) <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1">
                      Image 1 URL (Primary) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image1}
                        onChange={(e) =>
                          setFormData({ ...formData, image1: e.target.value })
                        }
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-image1"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "image1");
                        }}
                      />
                      <label
                        htmlFor="upload-image1"
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap"
                      >
                        {uploadingField === "image1" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Upload"
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">
                      Image 2 URL <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image2}
                        onChange={(e) =>
                          setFormData({ ...formData, image2: e.target.value })
                        }
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-image2"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "image2");
                        }}
                      />
                      <label
                        htmlFor="upload-image2"
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap"
                      >
                        {uploadingField === "image2" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Upload"
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">
                      Image 3 URL <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image3}
                        onChange={(e) =>
                          setFormData({ ...formData, image3: e.target.value })
                        }
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-image3"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "image3");
                        }}
                      />
                      <label
                        htmlFor="upload-image3"
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap"
                      >
                        {uploadingField === "image3" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Upload"
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">
                      Image 4 URL <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image4}
                        onChange={(e) =>
                          setFormData({ ...formData, image4: e.target.value })
                        }
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-image4"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "image4");
                        }}
                      />
                      <label
                        htmlFor="upload-image4"
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap"
                      >
                        {uploadingField === "image4" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Upload"
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price, Stock, SKU */}
              <div className="pt-2 border-t">
                <div className="font-semibold text-gray-900 mb-2">
                  Pricing & Stock Details
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Price (₹) <span className="text-red-500">*</span>
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
                      Initial Stock <span className="text-red-500">*</span>
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
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIE-WAY-01"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                    />
                  </div>
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Delete Product</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 font-semibold text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                disabled={deletingId !== null}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deletingId !== null ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
