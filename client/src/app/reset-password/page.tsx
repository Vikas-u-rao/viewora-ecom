'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const strength = getPasswordStrength(password);
  const strengthScore = Object.values(strength).filter(Boolean).length;
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-400', 'bg-green-500'];

  function validate() {
    const errs: { password?: string; confirmPassword?: string } = {};
    if (!password) errs.password = 'Password is required';
    else if (!isStrongPassword(strength)) errs.password = 'Password does not meet strength requirements';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!token) { setError('Reset token is missing. Please request a new reset link.'); return; }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error?.message || data?.message || 'Failed to reset password.';
        setError(message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login?reset=success'), 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-sm p-8 text-center shadow-2xl">
          <AlertCircle className="size-10 text-destructive mx-auto mb-4" />
          <h1 className="font-serif text-xl mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground text-sm mb-6">This reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="inline-block bg-gold text-background px-8 py-3 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors">
            REQUEST NEW LINK
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src={logoImg} alt="Viewora" className="h-20 w-auto mx-auto" width={160} height={160} priority />
          </Link>
          <p className="text-gold tracking-[0.3em] text-xs mt-3">FASHION EYEWEAR</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-sm p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="font-serif text-2xl font-normal text-foreground mb-1">Reset Password</h1>
            <p className="text-muted-foreground text-sm">Create a new, strong password for your account</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 p-3.5 rounded-sm border border-green-500/30 bg-green-500/10 text-green-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle className="size-4 shrink-0" />
              <p>Password updated successfully! Redirecting to login…</p>
            </div>
          )}

          <form id="reset-password-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="reset-password" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="Create a strong password"
                  disabled={success}
                  className={`w-full bg-input border pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors disabled:opacity-60 ${fieldErrors.password ? 'border-destructive' : 'border-border'}`}
                />
                <button
                  type="button"
                  id="reset-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-destructive text-xs mt-1.5">{fieldErrors.password}</p>}
              
              {/* Strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strengthScore ? strengthColors[strengthScore] : 'bg-border'}`} />
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
                      <div key={key} className={`text-xs flex items-center gap-1 transition-colors ${strength[key as keyof PasswordStrength] ? 'text-green-400' : 'text-muted-foreground'}`}>
                        <CheckCircle className="size-3" />{label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  placeholder="Repeat your new password"
                  disabled={success}
                  className={`w-full bg-input border pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors disabled:opacity-60 ${fieldErrors.confirmPassword ? 'border-destructive' : 'border-border'}`}
                />
                <button
                  type="button"
                  id="reset-toggle-confirm"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-destructive text-xs mt-1.5">{fieldErrors.confirmPassword}</p>}
              
              {/* Match indicator */}
              {confirmPassword && password && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${confirmPassword === password ? 'text-green-400' : 'text-destructive'}`}>
                  <CheckCircle className="size-3" />
                  {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="reset-password-submit"
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-gold text-background py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  SAVING PASSWORD…
                </>
              ) : success ? (
                <>
                  <CheckCircle className="size-4" />
                  PASSWORD UPDATED!
                </>
              ) : 'SAVE PASSWORD'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 tracking-widest">
          © 2026 VIEWORA — FASHION EYEWEAR
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
