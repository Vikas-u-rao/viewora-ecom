'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Root error boundary — shown when an unhandled error occurs in any route segment.
 * Replaces the blank-screen crash that would otherwise occur.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in development; replace with Sentry or similar in production
    console.error('[Viewora Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
      <p className="text-gold tracking-[0.3em] text-xs mb-4 font-semibold uppercase">
        Something went wrong
      </p>
      <h1 className="font-serif text-4xl font-normal mb-4 text-white">
        Unexpected Error
      </h1>
      <p className="text-muted-foreground text-base mb-8 max-w-md font-sans leading-relaxed">
        We encountered an unexpected issue. Our team has been notified. Please
        try again or return to the homepage.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={reset}
          className="bg-gold text-background px-8 py-3 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-all duration-300 uppercase"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="border border-gold/50 text-gold px-8 py-3 text-xs font-bold tracking-[0.2em] hover:bg-gold hover:text-background transition-all duration-300 uppercase"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
