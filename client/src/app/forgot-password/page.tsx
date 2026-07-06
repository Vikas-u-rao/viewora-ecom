'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { API_BASE } from '@/context/AuthContext';
import logoImg from '@/assets/logo.png';

function ForgotPasswordContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!email) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); return false; }
    setEmailError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        const message = data?.error?.message || data?.message || 'Failed. Please try again.';
        if (res.status === 404) {
          setEmailError('No account found with this email.');
          return;
        }
        setError(message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}&purpose=forgot_password`);
      }, 1500);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <Image src={logoImg} alt="Viewora" className="h-14 w-auto mx-auto" width={112} height={112} priority />
          </Link>
          <p className="text-gold tracking-[0.3em] text-xs mt-3">FASHION EYEWEAR</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-sm p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="font-serif text-2xl font-normal text-foreground mb-1">Forgot Password?</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter your registered email address and we&apos;ll send you a one-time password to reset it.
            </p>
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
              <p>OTP sent! Redirecting to verification…</p>
            </div>
          )}

          <form id="forgot-password-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-xs tracking-[0.15em] text-muted-foreground mb-2 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="you@example.com"
                  disabled={isLoading || success}
                  className={`w-full bg-input border pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors disabled:opacity-60 ${emailError ? 'border-destructive' : 'border-border'}`}
                />
              </div>
              {emailError && <p className="text-destructive text-xs mt-1.5">{emailError}</p>}
            </div>

            <button
              id="forgot-password-submit"
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-gold text-background py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  SENDING OTP…
                </>
              ) : 'SEND OTP'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              <ArrowLeft className="size-4" />
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
