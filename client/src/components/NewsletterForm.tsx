'use client';

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); setEmail(""); }} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 bg-input border border-border px-5 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none font-sans"
      />
      <button type="submit" className="bg-gold text-background px-8 py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors cursor-pointer">
        SUBSCRIBE
      </button>
    </form>
  );
}
