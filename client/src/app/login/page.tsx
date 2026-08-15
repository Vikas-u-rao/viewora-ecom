'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/constants';
import logoImg from '@/assets/logo.png';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setIsLoading(true);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = data?.error?.code || data?.code;
        const message = data?.error?.message || data?.message || `Login failed (${res.status} ${res.statusText})`;
        
        if (res.status === 403) {
          // Account not verified — redirect to OTP
          setError({ message: 'Your account is not verified. Please verify your email to continue.', code: 'ACCOUNT_NOT_VERIFIED' });
          return;
        }
        setError({ message, code });
        return;
      }

      setSuccess(true);
      setAuth(data.user, data.accessToken);

      setTimeout(() => {
        if (data.user?.role === 'admin' && redirect === '/') {
          router.push('/admin');
        } else {
          router.push(redirect);
        }
      }, 1000);
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError({ message: err?.message || 'Connection error. Please check your network connection and try again.' });
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
            <Image src={logoImg} alt="Viewora" className="h-20 w-auto mx-auto" width={160} height={160} priority />
          </Link>
          <p className="text-gold tracking-[0.3em] text-xs mt-3">FASHION EYEWEAR</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-sm p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="font-serif text-2xl font-normal text-foreground mb-1">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Sign in to your Viewora account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <div>
                <p>{error.message}</p>
                {error.code === 'ACCOUNT_NOT_VERIFIED' && (
                  <Link
                    href={`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`}
                    className="underline mt-1 inline-block hover:text-destructive/80 transition-colors"
                  >
                    Verify your account →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-5 flex items-center gap-3 p-3.5 rounded-sm border border-green-500/30 bg-green-500/10 text-green-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle className="size-4 shrink-0" />
              <p>Signed in successfully! Redirecting…</p>
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                  placeholder="you@example.com"
                  className={`w-full bg-input border pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors ${errors.email ? 'border-destructive' : 'border-border'}`}
                />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="block text-xs tracking-[0.15em] text-muted-foreground uppercase">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-soft transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                  placeholder="Enter your password"
                  className={`w-full bg-input border pl-10 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors ${errors.password ? 'border-destructive' : 'border-border'}`}
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1.5">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <label htmlFor="login-remember" className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border border-border bg-input peer-checked:bg-gold peer-checked:border-gold transition-colors flex items-center justify-center">
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
            </label>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-gold text-background py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  SIGNING IN…
                </>
              ) : success ? (
                <>
                  <CheckCircle className="size-4" />
                  SUCCESS!
                </>
              ) : (
                'SIGN IN'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground tracking-widest">OR</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Create account */}
          <Link
            id="login-create-account"
            href={redirect && redirect !== '/' ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
            className="w-full border border-gold text-gold py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors flex items-center justify-center"
          >
            CREATE AN ACCOUNT
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 tracking-widest">
          © 2026 VIEWORA — FASHION EYEWEAR
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
