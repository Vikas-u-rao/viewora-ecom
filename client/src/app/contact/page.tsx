"use client";

import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Mail, Phone, MapPin, Clock, CheckCircle2, Send } from "lucide-react";

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormState({ name: "", email: "", subject: "", message: "" });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in duration-300">
      <Header />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 px-6 bg-black border-b border-border/40 text-center">
        <div className="max-w-3xl mx-auto pt-6">
          <p className="text-gold tracking-[0.4em] text-xs mb-3 font-semibold uppercase">GET IN TOUCH</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-white mb-4">
            Contact <span className="text-gold font-bold italic">Viewora</span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 font-sans max-w-xl mx-auto font-light leading-relaxed">
            Have questions about frame fitting, order status, or custom prescriptions? Our Concierge team is here to assist you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <p className="text-gold tracking-[0.3em] text-xs font-semibold uppercase mb-2">Concierge Desk</p>
              <h2 className="text-3xl font-serif text-white">We &apos;d Love to Hear From You</h2>
              <div className="h-[1px] w-16 bg-gold/40 mt-3" />
            </div>

            <div className="space-y-6 font-sans">
              <div className="flex items-start gap-4 p-4 border border-border/50 bg-card">
                <div className="p-3 bg-gold/10 text-gold rounded-full shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Flagship Gallery</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    102 High Street, Luxury Avenue,<br />
                    Mumbai, MH 400001, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border/50 bg-card">
                <div className="p-3 bg-gold/10 text-gold rounded-full shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Telephone Support</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    +91 (022) 8800-8800<br />
                    Toll-Free: 1800-VIEWORA
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border/50 bg-card">
                <div className="p-3 bg-gold/10 text-gold rounded-full shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Email Inquiries</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    concierge@viewora.com<br />
                    support@viewora.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-border/50 bg-card">
                <div className="p-3 bg-gold/10 text-gold rounded-full shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Operating Hours</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Monday – Saturday: 10:00 AM – 8:00 PM IST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-card border border-border/60 p-8 sm:p-10 relative">
            <h3 className="text-2xl font-serif text-white mb-2">Send a Message</h3>
            <p className="text-xs text-muted-foreground font-sans mb-8">
              Fill out the form below and a Viewora styling expert will respond within 24 hours.
            </p>

            {submitted ? (
              <div className="py-16 text-center space-y-4 animate-fade-in">
                <div className="inline-flex p-4 bg-gold/10 text-gold rounded-full">
                  <CheckCircle2 size={48} />
                </div>
                <h4 className="text-2xl font-serif text-white">Message Received</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto font-sans leading-relaxed">
                  Thank you for reaching out to Viewora. Our team has received your message and will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 border border-gold/40 text-gold px-6 py-2.5 text-xs font-bold tracking-widest hover:bg-gold hover:text-black transition-colors uppercase cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full bg-background border border-border px-4 py-3 text-sm text-white focus:border-gold outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full bg-background border border-border px-4 py-3 text-sm text-white focus:border-gold outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Subject</label>
                  <input
                    type="text"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    placeholder="Inquiry regarding prescription lenses / fitting"
                    className="w-full bg-background border border-border px-4 py-3 text-sm text-white focus:border-gold outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Message *</label>
                  <textarea
                    rows={5}
                    required
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="How can our concierge team assist you today?"
                    className="w-full bg-background border border-border px-4 py-3 text-sm text-white focus:border-gold outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold text-background py-4 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-all uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-6 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl mb-4 font-serif">
            Join the <span className="text-gold font-bold uppercase">Viewora</span> Club
          </h2>
          <p className="text-muted-foreground mb-8 text-sm font-sans">
            Subscribe for concierge privilege announcements, seasonal launches, and style advice.
          </p>
          <NewsletterForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
