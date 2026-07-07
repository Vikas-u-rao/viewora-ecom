"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Mail, Save, User } from "lucide-react";
import { toast } from "sonner";
import AccountLayout from "@/components/AccountLayout";
import { useAuth } from "@/context/AuthContext";
import { updateProfileApi } from "@/services/account";

export default function AccountProfilePage() {
  const { user, accessToken, setAuth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Full name and email are required.");
      return;
    }

    setSaving(true);
    try {
      const data = await updateProfileApi(accessToken, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      setAuth(data.user, accessToken);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout title="Profile">
      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border border-border bg-input py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gold"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-border bg-input py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gold"
            />
          </div>
        </div>

        <button
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold px-7 py-3 text-xs font-bold tracking-[0.2em] text-background transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          SAVE CHANGES
        </button>
      </form>
    </AccountLayout>
  );
}
