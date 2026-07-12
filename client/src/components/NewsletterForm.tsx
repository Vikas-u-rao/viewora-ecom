'use client';

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setStatus('idle');
    setErrorMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${apiUrl}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to subscribe');
      }

      setStatus('success');
      setEmail("");
    } catch (error) {
      const err = error as Error;
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-xl mx-auto p-6 bg-card/45 border border-gold/40 text-center animate-fade-in">
        <h3 className="text-gold font-serif text-2xl mb-2">Thank you for subscribing!</h3>
        <p className="text-muted-foreground font-sans text-sm">
          Check your email for exclusive updates and our community offer.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          className="mt-4 text-xs font-bold tracking-widest text-white/90 hover:text-gold uppercase transition-colors"
        >
          SUBSCRIBE ANOTHER →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          disabled={isLoading}
          className="flex-1 bg-input border border-border px-5 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none font-sans disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-gold text-background px-8 py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors cursor-pointer disabled:opacity-70 flex items-center justify-center min-w-[160px]"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin"></span>
          ) : (
            "SUBSCRIBE"
          )}
        </button>
      </form>
      
      {status === 'error' && (
        <p className="text-destructive text-sm mt-3 text-left font-sans animate-fade-in">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
