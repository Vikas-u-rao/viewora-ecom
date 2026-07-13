'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, RefreshCcw, ArrowLeft } from 'lucide-react';
import { API_BASE } from '@/context/AuthContext';
import logoImg from '@/assets/logo.png';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

function OtpVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const purpose = (searchParams.get('purpose') || 'signup') as 'signup' | 'forgot_password';
  const redirect = searchParams.get('redirect') || '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    const singleChar = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = singleChar;
      return next;
    });
    if (singleChar && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        setOtp((prev) => { const next = [...prev]; next[index] = ''; return next; });
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setOtp((prev) => { const next = [...prev]; next[index - 1] = ''; return next; });
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }, []);

  async function handleVerify() {
    const otpCode = otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setError(null);
    setIsVerifying(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, purpose }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message || data?.message || 'Invalid OTP. Please try again.');
        return;
      }

      if (purpose === 'signup') {
        setSuccess('Account verified! Redirecting to login…');
        setTimeout(() => router.push(`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`), 1800);
      } else {
        // For forgot password, save resetToken and redirect
        const resetToken = data.resetToken;
        setSuccess('OTP verified. Redirecting to reset password…');
        setTimeout(() => router.push(`/reset-password?token=${encodeURIComponent(resetToken)}`), 1200);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);
    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || data?.message || 'Failed to resend OTP. Please try again.');
        return;
      }
      setCountdown(COUNTDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setSuccess('OTP resent successfully! Check your email.');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1****$2');

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
            <h1 className="font-serif text-2xl font-normal text-foreground mb-1">
              {purpose === 'signup' ? 'Verify Your Account' : 'Verify Your Identity'}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We&apos;ve sent a 6-digit OTP to{' '}
              <span className="text-gold font-medium">{maskedEmail}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-sm border border-destructive/30 bg-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-5 flex items-center gap-3 p-3.5 rounded-sm border border-green-500/30 bg-green-500/10 text-green-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle className="size-4 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* OTP Inputs */}
          <div className="mb-6">
            <label className="block text-xs tracking-[0.15em] text-muted-foreground mb-4 uppercase text-center">
              Enter OTP
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold bg-input border transition-all duration-200 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 caret-transparent ${digit ? 'border-gold text-gold' : 'border-border text-foreground'}`}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Timer & Resend */}
          <div className="flex items-center justify-center gap-2 mb-6 text-sm">
            {countdown > 0 ? (
              <p className="text-muted-foreground">
                Resend OTP in{' '}
                <span className="text-gold font-semibold tabular-nums">
                  {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <button
                id="resend-otp-button"
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center gap-2 text-gold hover:text-gold-soft transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCcw className="size-4" />
                )}
                {isResending ? 'Resending…' : 'Resend OTP'}
              </button>
            )}
          </div>

          {/* Verify Button */}
          <button
            id="verify-otp-button"
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || !!success || otp.join('').length < OTP_LENGTH}
            className="w-full bg-gold text-background py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                VERIFYING…
              </>
            ) : 'VERIFY OTP'}
          </button>

          {/* Back links */}
          <div className="mt-5 text-center">
            <Link
              href={purpose === 'signup' ? '/register' : '/forgot-password'}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              <ArrowLeft className="size-3" />
              {purpose === 'signup' ? 'Back to Register' : 'Back to Forgot Password'}
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

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    }>
      <OtpVerifyContent />
    </Suspense>
  );
}
