"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Loader2, Plus, Tag, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/components/dashboard/useDashboardData";

export default function CouponsPage() {
  const { accessToken } = useAuth();
  const { coupons, fetchLoading } = useDashboardData(accessToken);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const filteredCoupons = coupons.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.code.toLowerCase().includes(q) ||
      (c.user?.email && c.user.email.toLowerCase().includes(q))
    );
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newValue || !newExpiry) return;
    setActionLoading("create-coupon");
    try {
      const body: { code: string; value: number; expiresAt: string; userEmail?: string } = {
        code: newCode.toUpperCase(),
        value: Number(newValue),
        expiresAt: new Date(newExpiry).toISOString(),
      };
      if (newEmail) body.userEmail = newEmail;

      const res = await fetch(`${apiUrl}/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create coupon");
      setNewCode("");
      setNewValue("");
      setNewExpiry("");
      setNewEmail("");
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to invalidate this coupon?")) return;
    setActionLoading(`delete-${couponId}`);
    try {
      await fetch(`${apiUrl}/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
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
          Campaign Discount Coupons
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Create and manage promotional discount codes
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.8fr] gap-8">
        {/* Create Coupon Form */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Plus className="size-4 text-gray-700" /> Create Coupon
          </h3>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-semibold text-gray-700">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500 uppercase text-[10px]">Coupon Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. SUMMER25"
                className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500 uppercase text-[10px]">Discount (INR)</label>
              <input
                type="number"
                required
                min="1"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. 250"
                className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500 uppercase text-[10px]">Expiry Date</label>
              <input
                type="date"
                required
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-500 uppercase text-[10px]">User Email (Optional)</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@domain.com"
                className="bg-white border border-gray-200 px-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading === "create-coupon"}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center justify-center cursor-pointer"
            >
              {actionLoading === "create-coupon" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create Promo Code"
              )}
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search coupon codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pl-10 pr-3.5 py-2 rounded-xl text-sm focus:border-gray-900 outline-none text-gray-800"
            />
          </div>

          {fetchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-150 rounded-xl space-y-2">
              <Tag className="size-10 text-gray-300 mx-auto" />
              <h4 className="text-sm font-bold text-gray-700">No Coupons</h4>
              <p className="text-xs text-gray-400">Launch a campaign by creating your first coupon.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Expires</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-700">
                  {filteredCoupons.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{c.code}</td>
                      <td className="p-3.5 font-bold">
                        ₹{Number(c.value).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-gray-500">
                        {c.user?.email || "Global (Any)"}
                      </td>
                      <td className="p-3.5">
                        {new Date(c.expiresAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 uppercase font-bold rounded border ${
                            c.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {c.status === "active" && (
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            disabled={actionLoading === `delete-${c.id}`}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer"
                          >
                            {actionLoading === `delete-${c.id}` ? (
                              <Loader2 className="size-3 animate-spin ml-auto" />
                            ) : (
                              "Invalidate"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
