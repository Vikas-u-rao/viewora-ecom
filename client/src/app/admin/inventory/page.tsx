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
  const { products, fetchLoading, productsPage, productsTotalPages, setProductsPage } =
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
      window.location.reload();
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

      // Reset modal and trigger refresh
      setIsModalOpen(false);
      setFormData(initialFormData);

      // Refresh current page products
      window.location.reload();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error creating product");
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
                <div className="flex items-start justify-between mb-4">
                  <div>
                    {p.brand && (
                      <span className="text-[10px] tracking-wider text-gray-500 font-bold uppercase">
                        {p.brand}
                      </span>
                    )}
                    <h3 className="text-base text-gray-900 font-bold">{p.name}</h3>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(p.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Delete product"
                  >
                    <Trash2 className="size-4" />
                  </button>
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
                              {detailItems.length > 0 ? (
                                <div className="flex max-w-[250px] flex-wrap items-center gap-1.5 py-1">
                                  {detailItems.map((item) => (
                                    <span
                                      key={`${v.id}-${item.label}-${item.value}`}
                                      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] leading-4 text-gray-700 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
                                    >
                                      <span className="font-semibold text-gray-500">{item.label}:</span>
                                      <span className="font-bold text-gray-900">{item.value}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right align-middle font-medium text-gray-900">
                              ₹{Number(v.price).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-3 text-center align-middle font-bold">
                              {v.stock <= 2 ? (
                                <span className="inline-flex items-center justify-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                                  {v.stock} (Low)
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                  {v.stock}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right align-middle">
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
