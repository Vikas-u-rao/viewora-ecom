"use client";
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useState } from "react";
import { Edit2, Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AccountLayout from "@/components/AccountLayout";
import AddressFormFields from "@/components/AddressFormFields";
import { useAuth } from "@/context/AuthContext";
import { Address, AddressPayload, deleteAddressApi, fetchAddressesApi, saveAddressApi } from "@/services/account";

const emptyForm: AddressPayload = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

export default function AccountAddressesPage() {
  const { accessToken, user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<AddressPayload>({ ...emptyForm });

  const loadAddresses = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setAddresses(await fetchAddressesApi(accessToken));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [accessToken]);

  const startAdd = () => {
    setEditingId(undefined);
    setForm({ ...emptyForm, name: user?.name || "" });
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label || "Home",
      name: address.name,
      phone: address.phone || "",
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;

    if (!form.name.trim() || !form.line1.trim() || !form.city.trim() || !form.state.trim()) {
      toast.error("Please complete all required address fields.");
      return;
    }

    if (!/^\d{10}$/.test((form.phone || "").trim())) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (!/^\d{6}$/.test((form.pincode || "").trim())) {
      toast.error("Pincode must be exactly 6 digits.");
      return;
    }

    setSaving(true);
    try {
      await saveAddressApi(accessToken, {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2?.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      }, editingId);
      toast.success(editingId ? "Address updated." : "Address added.");
      startAdd();
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm("Delete this address?")) return;
    try {
      await deleteAddressApi(accessToken, id);
      toast.success("Address deleted.");
      await loadAddresses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete address.");
    }
  };

  const setDefault = async (address: Address) => {
    if (!accessToken) return;
    await saveAddressApi(accessToken, { ...address, isDefault: true }, address.id);
    toast.success("Default shipping address updated.");
    await loadAddresses();
  };

  return (
    <AccountLayout title="Addresses">
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-gold" /></div>
          ) : addresses.length === 0 ? (
            <div className="border border-dashed border-border py-16 text-center text-muted-foreground">
              <MapPin className="mx-auto mb-3 size-8" />
              No saved addresses yet.
            </div>
          ) : addresses.map((address) => (
            <div key={address.id} className={`border p-5 ${address.isDefault ? "border-gold bg-gold/5" : "border-border"}`}>
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{address.label || "Address"}</p>
                  <h2 className="mt-2 font-semibold text-white">{address.name}</h2>
                </div>
                {address.isDefault && <span className="bg-gold px-2 py-1 text-[10px] font-bold text-background">DEFAULT</span>}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
                {address.city}, {address.state} - {address.pincode}
              </p>
              {address.phone && <p className="mt-1 text-sm text-muted-foreground">📞 {address.phone}</p>}
              <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
                {!address.isDefault && (
                  <button onClick={() => setDefault(address)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold">
                    <Star className="size-3.5" /> Set default
                  </button>
                )}
                <button onClick={() => startEdit(address)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold">
                  <Edit2 className="size-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(address.id)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border border-border bg-background/40 p-5 rounded-none">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-serif text-xl text-white">{editingId ? "Edit Address" : "Add Address"}</h2>
            <button type="button" onClick={startAdd} className="text-gold flex items-center gap-1 text-xs"><Plus className="size-4" /> Reset</button>
          </div>
          
          <AddressFormFields
            form={form}
            onChange={(updated) => setForm(updated)}
            disabled={saving}
          />

          <label className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))} />
            Set as default shipping address
          </label>

          <button disabled={saving} className="flex w-full items-center justify-center gap-2 bg-gold py-3 text-xs font-bold tracking-[0.2em] text-background disabled:opacity-60 transition-opacity">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editingId ? "SAVE ADDRESS" : "ADD ADDRESS"}
          </button>
        </form>
      </div>
    </AccountLayout>
  );
}
