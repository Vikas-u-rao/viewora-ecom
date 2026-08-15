"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Check, X, ArrowLeft, Layers, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiBaseUrl } from "@/lib/constants";
import { ApiProduct, fetchProductsApi } from "@/services/products";

interface EditorialCollectionAdmin {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  editorialIntro: string | null;
  heroImage: string | null;
  status: string;
  displayOrder: number;
  products: {
    productId: string;
    product: {
      id: string;
      name: string;
      slug: string;
      brand: string | null;
      startingPrice: string;
    };
  }[];
}

export default function AdminEditorialCollectionsPage() {
  const { accessToken } = useAuth();
  const [collections, setCollections] = useState<EditorialCollectionAdmin[]>([]);
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    editorialIntro: "",
    heroImage: "",
    status: "published",
    displayOrder: 0,
    selectedProductIds: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [colRes, prodData] = await Promise.all([
        fetch(`${getApiBaseUrl()}/editorial-collections/admin/list`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetchProductsApi("?limit=100"),
      ]);

      if (colRes.ok) {
        const colData = await colRes.json();
        setCollections(colData);
      } else {
        setError("Failed to fetch editorial collections");
      }

      setAllProducts(prodData.products || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [accessToken]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      editorialIntro: "",
      heroImage: "",
      status: "published",
      displayOrder: collections.length + 1,
      selectedProductIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: EditorialCollectionAdmin) => {
    setEditingId(col.id);
    setFormData({
      title: col.title,
      slug: col.slug,
      description: col.description || "",
      editorialIntro: col.editorialIntro || "",
      heroImage: col.heroImage || "",
      status: col.status,
      displayOrder: col.displayOrder,
      selectedProductIds: col.products.map((p) => p.productId),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) return;

    setIsSaving(true);
    try {
      const url = editingId
        ? `${getApiBaseUrl()}/editorial-collections/admin/${editingId}`
        : `${getApiBaseUrl()}/editorial-collections/admin`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          editorialIntro: formData.editorialIntro,
          heroImage: formData.heroImage,
          status: formData.status,
          displayOrder: formData.displayOrder,
          productIds: formData.selectedProductIds,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save collection");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save collection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/editorial-collections/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        loadData();
      } else {
        alert("Failed to delete collection");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  const toggleProductSelection = (productId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedProductIds.includes(productId);
      if (exists) {
        return {
          ...prev,
          selectedProductIds: prev.selectedProductIds.filter((id) => id !== productId),
        };
      } else {
        return {
          ...prev,
          selectedProductIds: [...prev.selectedProductIds, productId],
        };
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
              <Link href="/admin" className="hover:text-gray-900 flex items-center gap-1">
                <ArrowLeft className="size-3.5" /> Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold font-serif flex items-center gap-2 text-gray-900">
              <Sparkles className="size-6 text-amber-600" /> The Edit — Curated Collections CMS
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage fashion/editorial collections, edit descriptions, hero images, and assign curated products.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="size-4" /> Create Editorial Story
          </button>
        </div>

        {/* Collections Table / Grid */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-sm text-gray-500">
            Loading editorial collections...
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-sm">
            {error}
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
            <Layers className="size-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">No Editorial Stories Found</p>
            <p className="text-xs text-gray-500">Click &quot;Create Editorial Story&quot; above to add your first story.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] tracking-wider font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      Order: {col.displayOrder}
                    </span>
                    <span
                      className={`text-[10px] tracking-wider font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        col.status === "published"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {col.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">{col.title}</h3>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">/the-edit/{col.slug}</p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{col.description || "No description set."}</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>{col.products.length} Products Assigned</span>
                    <Link
                      href={`/the-edit/${col.slug}`}
                      target="_blank"
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      View Live →
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEdit(col)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    <Edit2 className="size-3.5" /> Edit Story
                  </button>
                  <button
                    onClick={() => handleDelete(col.id, col.title)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="font-serif text-xl font-bold text-gray-900">
                {editingId ? "Edit Editorial Collection" : "Create New Editorial Collection"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Quiet Luxury"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. quiet-luxury"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Short Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="One-line summary for cards & navigation"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Editorial Introduction</label>
                <textarea
                  rows={3}
                  value={formData.editorialIntro}
                  onChange={(e) => setFormData({ ...formData, editorialIntro: e.target.value })}
                  placeholder="1-2 paragraphs describing the mood, inspiration, and styling philosophy..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hero Image URL</label>
                <input
                  type="text"
                  value={formData.heroImage}
                  onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                  placeholder="https://cdn.viewora.in/..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:border-gray-900 outline-none"
                  />
                </div>
              </div>

              {/* Product Assignment Picker */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Assign Curated Products ({formData.selectedProductIds.length} Selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 divide-y divide-gray-100 bg-gray-50">
                  {allProducts.map((p) => {
                    const selected = formData.selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProductSelection(p.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          selected ? "bg-amber-50 text-amber-900 font-semibold" : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <div>
                          <span className="text-gray-900">{p.name}</span>
                          {p.brand && <span className="ml-2 text-[10px] text-amber-700 uppercase font-bold">({p.brand})</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {selected && <Check className="size-3.5 text-amber-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
