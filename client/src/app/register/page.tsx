'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE } from '@/context/AuthContext';
import logoImg from '@/assets/logo.png';

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function getPasswordStrength(password: string): PasswordStrength {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

function isStrongPassword(s: PasswordStrength): boolean {
  return s.hasMinLength && s.hasUppercase && s.hasLowercase && s.hasNumber && s.hasSpecial;
}

function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const s = getPasswordStrength(password);
  const score = Object.values(s).filter(Boolean).length;
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {[
          { key: 'hasMinLength', label: '8+ characters' },
          { key: 'hasUppercase', label: 'Uppercase letter' },
          { key: 'hasLowercase', label: 'Lowercase letter' },
          { key: 'hasNumber', label: 'Number' },
          { key: 'hasSpecial', label: 'Special character' },
        ].map(({ key, label }) => (
          <div key={key} className={`text-xs flex items-center gap-1 transition-colors ${s[key as keyof PasswordStrength] ? 'text-green-400' : 'text-muted-foreground'}`}>
            <CheckCircle className="size-3" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const errs: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (!isStrongPassword(getPasswordStrength(form.password))) {
      errs.password = 'Password does not meet the strength requirements';
    }
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.acceptTerms) errs.acceptTerms = 'You must accept the Terms & Conditions';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error?.message || data?.message || 'Registration failed. Please try again.';
        if (res.status === 409) {
          setFieldErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }));
          return;
        }
        setError(message);
        return;
      }

      // Redirect to OTP verification
      router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}&purpose=signup`);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src={logoImg} alt="Viewora" className="h-14 w-auto mx-auto" width={112} height={112} priority />
          </Link>
          <p className="text-gold tracking-[0.3em] text-xs mt-3">FASHION EYEWEAR</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-sm p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="font-serif text-2xl font-normal text-foreground mb-1">Create Account</h1>
            <p className="text-muted-foreground text-sm">Join the Viewora circle today</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="register-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Your full name"
                  className={`w-full bg-input border pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors ${fieldErrors.name ? 'border-destructive' : 'border-border'}`}
                />
              </div>
              {fieldErrors.name && <p className="text-destructive text-xs mt-1.5">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full bg-input border pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors ${fieldErrors.email ? 'border-destructive' : 'border-border'}`}
                />
              </div>
              {fieldErrors.email && <p className="text-destructive text-xs mt-1.5">{fieldErrors.email}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="register-phone" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">
                Phone Number <span className="normal-case tracking-normal text-muted-foreground/60">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-input border border-border pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full bg-input border pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors ${fieldErrors.password ? 'border-destructive' : 'border-border'}`}
                />
                <button
                  type="button"
                  id="register-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-destructive text-xs mt-1.5">{fieldErrors.password}</p>}
              <StrengthBar password={form.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="register-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full bg-input border pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors ${fieldErrors.confirmPassword ? 'border-destructive' : 'border-border'}`}
                />
                <button
                  type="button"
                  id="register-toggle-confirm"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-destructive text-xs mt-1.5">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div>
              <label htmlFor="register-terms" className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    id="register-terms"
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={(e) => setField('acceptTerms', e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className={`w-4 h-4 border bg-input peer-checked:bg-gold peer-checked:border-gold transition-colors flex items-center justify-center ${fieldErrors.acceptTerms ? 'border-destructive' : 'border-border'}`}>
                    {form.acceptTerms && (
                      <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                  I agree to the{' '}
                  <Link href="/terms" className="text-gold hover:underline">Terms & Conditions</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
                </span>
              </label>
              {fieldErrors.acceptTerms && <p className="text-destructive text-xs mt-1.5 ml-7">{fieldErrors.acceptTerms}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold text-background py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  CREATING ACCOUNT…
                </>
              ) : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:text-gold-soft transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 tracking-widest">
          © 2026 VIEWORA — FASHION EYEWEAR
        </p>
      </div>
    </div>
  );
}
