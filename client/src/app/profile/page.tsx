'use client';
/* eslint-disable */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, API_BASE } from '@/context/AuthContext';
import Header from '@/components/header';
import AddressFormFields from '@/components/AddressFormFields';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Home,
  Briefcase,
  Bookmark
} from 'lucide-react';

import { AddressPayload } from '@/services/account';

interface Address {
  id: string;
  label?: string | null;
  name: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, accessToken, isLoading, logout, setAuth, clearAuth } = useAuth();

  // Active tab state: 'profile' | 'addresses' | 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Address Modal/Form State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressPayload>({
    label: 'Home',
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Session Action State
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Sync profile details when user is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch addresses when switching to addresses tab
  const fetchAddresses = async () => {
    if (!accessToken) return;
    setIsLoadingAddresses(true);
    setAddressError(null);
    try {
      const res = await fetch(`${API_BASE}/users/me/addresses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      } else {
        const err = await res.json();
        setAddressError(err?.error?.message || 'Failed to fetch addresses');
      }
    } catch {
      setAddressError('Network error while fetching addresses');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses' && user) {
      fetchAddresses();
    }
  }, [activeTab, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    );
  }

  // Update Profile details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setIsUpdatingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim().toLowerCase(),
          phone: profileForm.phone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to update profile');
      }

      // Update AuthContext user details
      setAuth(data.user, accessToken);
      setProfileSuccess('Profile updated successfully');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred during update');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Open address modal for adding new
  const openAddAddressModal = () => {
    if (!user) return;
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      name: user.name || '',
      phone: user.phone || '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
    setModalError(null);
    setIsAddressModalOpen(true);
  };

  // Open address modal for editing
  const openEditAddressModal = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || 'Home',
      name: address.name,
      phone: address.phone || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setModalError(null);
    setIsAddressModalOpen(true);
  };

  // Submit address form (Add/Edit)
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!addressForm.name?.trim() || !addressForm.line1?.trim() || !addressForm.city?.trim() || !addressForm.state?.trim()) {
      setModalError('Please complete all required address fields.');
      return;
    }

    if (!/^\d{10}$/.test((addressForm.phone || '').trim())) {
      setModalError('Phone number must be exactly 10 digits.');
      return;
    }

    if (!/^\d{6}$/.test((addressForm.pincode || '').trim())) {
      setModalError('Pincode must be exactly 6 digits.');
      return;
    }

    setIsSubmittingAddress(true);
    setModalError(null);

    const payload = {
      label: addressForm.label,
      name: addressForm.name.trim(),
      phone: (addressForm.phone || '').trim(),
      line1: addressForm.line1.trim(),
      line2: (addressForm.line2 || '').trim() || null,
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
      isDefault: addressForm.isDefault,
    };

    try {
      const url = editingAddressId
        ? `${API_BASE}/users/me/addresses/${editingAddressId}`
        : `${API_BASE}/users/me/addresses`;
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || data?.message || 'Failed to save address');
      }

      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while saving address');
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const res = await fetch(`${API_BASE}/users/me/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || 'Failed to delete address');
      }

      fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting');
    }
  };

  // Logout all devices
  const handleLogoutAll = async () => {
    if (!accessToken) return;
    if (!confirm('This will sign you out of ALL devices. Continue?')) return;

    setIsLoggingOutAll(true);
    setSecurityError(null);
    setSecuritySuccess(null);

    try {
      const res = await fetch(`${API_BASE}/auth/logout-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || 'Logout-all failed');
      }

      setSecuritySuccess('Successfully logged out of all devices. Redirecting…');
      setTimeout(() => {
        clearAuth();
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to logout from all devices');
      setIsLoggingOutAll(false);
    }
  };

  // Helper to render label icon
  const getLabelIcon = (label?: string | null) => {
    const l = label?.toLowerCase();
    if (l === 'home') return <Home className="size-4 text-gold shrink-0" />;
    if (l === 'work' || l === 'office') return <Briefcase className="size-4 text-gold shrink-0" />;
    return <Bookmark className="size-4 text-gold shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-foreground mb-1.5">My Account</h1>
          <p className="text-muted-foreground text-sm">Manage your profile, shipping addresses, and sessions.</p>
        </div>

        <div className="grid md:grid-cols-[250px_1fr] gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wider transition-colors rounded-sm text-left whitespace-nowrap w-full ${
                activeTab === 'profile' ? 'bg-gold/10 text-gold border-b-2 md:border-b-0 md:border-l-2 border-gold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserIcon className="size-4 shrink-0" />
              PROFILE INFO
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wider transition-colors rounded-sm text-left whitespace-nowrap w-full ${
                activeTab === 'addresses' ? 'bg-gold/10 text-gold border-b-2 md:border-b-0 md:border-l-2 border-gold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MapPin className="size-4 shrink-0" />
              ADDRESS BOOK
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-wider transition-colors rounded-sm text-left whitespace-nowrap w-full ${
                activeTab === 'security' ? 'bg-gold/10 text-gold border-b-2 md:border-b-0 md:border-l-2 border-gold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="size-4 shrink-0" />
              SECURITY
            </button>
          </aside>

          {/* Tab Content Section */}
          <section className="bg-card border border-border p-6 md:p-8 shadow-xl min-h-[400px]">
            {/* Tab: Profile Info */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-200">
                <h2 className="font-serif text-2xl mb-6 text-foreground border-b border-border pb-3">Personal Details</h2>

                {profileSuccess && (
                  <div className="mb-6 flex items-center gap-3 p-3.5 rounded-sm border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
                    <CheckCircle className="size-4 shrink-0" />
                    <p>{profileSuccess}</p>
                  </div>
                )}

                {profileError && (
                  <div className="mb-6 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <p>{profileError}</p>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-xs tracking-widest text-muted-foreground mb-2 uppercase">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full bg-input border border-border pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs tracking-widest text-muted-foreground mb-2 uppercase">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full bg-input border border-border pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs tracking-widest text-muted-foreground mb-2 uppercase">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full bg-input border border-border pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-gold text-background px-8 py-3.5 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          UPDATING PROFILE…
                        </>
                      ) : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Addresses */}
            {activeTab === 'addresses' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
                  <h2 className="font-serif text-2xl text-foreground">Saved Addresses</h2>
                  <button
                    onClick={openAddAddressModal}
                    className="flex items-center gap-1.5 border border-gold text-gold hover:bg-gold hover:text-background px-4 py-2 text-xs font-bold tracking-wider transition-colors rounded-sm"
                  >
                    <Plus className="size-3.5" />
                    ADD NEW
                  </button>
                </div>

                {addressError && (
                  <div className="mb-6 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <p>{addressError}</p>
                  </div>
                )}

                {isLoadingAddresses ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-7 animate-spin text-gold" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-border rounded-sm">
                    <MapPin className="size-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">No addresses saved yet.</p>
                    <button
                      onClick={openAddAddressModal}
                      className="bg-gold text-background px-6 py-2.5 text-xs font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors"
                    >
                      ADD FIRST ADDRESS
                    </button>
                  </div>
                ) : (
<div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border p-5 rounded-sm flex flex-col justify-between transition-colors relative ${
                          address.isDefault ? 'border-gold bg-gold/5 shadow-md' : 'border-border bg-card hover:border-muted-foreground'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="flex items-center gap-1.5 text-xs tracking-wider uppercase font-bold text-gold">
                              {getLabelIcon(address.label)}
                              {address.label || 'Address'}
                            </span>
                            {address.isDefault && (
                              <span className="text-[10px] tracking-widest font-bold bg-gold text-background px-2 py-0.5 uppercase">
                                DEFAULT
                              </span>
                            )}
                          </div>

                          <h3 className="font-semibold text-sm mb-1">{address.name}</h3>
                          <p className="text-muted-foreground text-xs leading-relaxed space-y-0.5">
                            <div>{address.line1}</div>
                            {address.line2 && <div>{address.line2}</div>}
                            <div>{address.city}, {address.state} - {address.pincode}</div>
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                          <button
                            onClick={() => openEditAddressModal(address)}
                            className="text-muted-foreground hover:text-gold transition-colors text-xs flex items-center gap-1"
                            title="Edit Address"
                          >
                            <Edit2 className="size-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors text-xs flex items-center gap-1"
                            title="Delete Address"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Security */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in duration-200">
                <h2 className="font-serif text-2xl mb-6 text-foreground border-b border-border pb-3">Security & Session</h2>

                {securitySuccess && (
                  <div className="mb-6 flex items-center gap-3 p-3.5 rounded-sm border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
                    <CheckCircle className="size-4 shrink-0" />
                    <p>{securitySuccess}</p>
                  </div>
                )}

                {securityError && (
                  <div className="mb-6 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <p>{securityError}</p>
                  </div>
                )}

                <div className="space-y-8 max-w-xl">
                  <div className="border border-border p-6 rounded-sm bg-input/50">
                    <h3 className="text-sm font-semibold tracking-wider uppercase mb-2 flex items-center gap-2">
                      <LogOut className="size-4 text-gold shrink-0" />
                      Sign Out Options
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                      You can sign out of your current session on this browser or revoke authorization globally across all your active devices.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={logout}
                        className="border border-border hover:border-gold hover:text-gold text-foreground px-6 py-3 text-xs font-bold tracking-[0.15em] transition-colors flex items-center justify-center gap-2 rounded-sm"
                      >
                        LOGOUT CURRENT SESSION
                      </button>

                      <button
                        onClick={handleLogoutAll}
                        disabled={isLoggingOutAll}
                        className="bg-destructive hover:bg-destructive/80 text-white px-6 py-3 text-xs font-bold tracking-[0.15em] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 rounded-sm"
                      >
                        {isLoggingOutAll ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            LOGGING OUT ALL…
                          </>
                        ) : 'LOGOUT ALL DEVICES'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Elegant Address Modal Dialog */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border max-w-lg w-full rounded-sm p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h3 className="font-serif text-xl mb-4 text-foreground">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>

            {modalError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="text-xs">{modalError}</p>
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <AddressFormFields
                form={addressForm}
                onChange={(updated) => setAddressForm(updated)}
                disabled={isSubmittingAddress}
              />

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="accent-gold rounded-sm size-4"
                  />
                  <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Set as default shipping address
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="border border-border hover:border-gold text-foreground hover:text-gold px-5 py-2.5 text-xs font-bold tracking-wider transition-colors rounded-sm"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAddress}
                  className="bg-gold text-background px-6 py-2.5 text-xs font-bold tracking-wider hover:bg-gold-soft transition-colors disabled:opacity-60 flex items-center gap-1.5 rounded-sm"
                >
                  {isSubmittingAddress && <Loader2 className="size-3 animate-spin" />}
                  {editingAddressId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
