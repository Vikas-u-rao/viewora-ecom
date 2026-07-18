'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { API_BASE } from '@/context/AuthContext';

export default function InquiryModal() {
  const { isInquiryOpen, closeInquiry } = useUI();
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    product: '',
    message: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Transition mount states
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInquiryOpen) {
      timer = setTimeout(() => {
        setIsMounted(true);
      }, 0);
      document.body.style.overflow = 'hidden';
    } else {
      timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      document.body.style.overflow = 'unset';
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isInquiryOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isInquiryOpen) {
        closeInquiry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInquiryOpen, closeInquiry]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeInquiry();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const name = formData.fullName.trim();
    if (!name) {
      newErrors.fullName = 'Full Name is required';
    } else if (name.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    } else if (/[^a-zA-Z\s'-]/.test(name)) {
      newErrors.fullName = 'Name contains invalid characters';
    }

    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const phone = formData.phone.trim();
    if (!phone) {
      newErrors.phone = 'Phone Number is required';
    } else if (!/^(\+91|0)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit Indian phone number';
    }

    const subject = formData.subject.trim();
    if (!subject) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    const message = formData.message.trim();
    if (!message) {
      newErrors.message = 'Message is required';
    } else if (message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (message.length > 2000) {
      newErrors.message = 'Message must be under 2000 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to submit inquiry');
      }
      setIsSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        product: '',
        message: ''
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSuccess = () => {
    setIsSuccess(false);
    closeInquiry();
  };

  return (
    <>
      {/* Floating WhatsApp Chatbot Button */}
      <a
        href="https://wa.me/919999999999?text=Hello%20Viewora!%20I%20would%20like%20to%20inquire%20about%20eyewear."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 bg-black hover:bg-neutral-900 text-[#25D366] p-3 rounded-full shadow-2xl hover:shadow-[0_0_30px_rgba(37,211,102,0.25)] transition-all duration-300 hover:-translate-y-1 flex items-center justify-center cursor-pointer border border-[#25D366]/25"
        title="Chat on WhatsApp"
      >
        <svg className="w-8 h-8 fill-[#25D366]" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
        </svg>
      </a>

      {/* Modal Overlay & Dialog */}
      {isMounted && (
        <div
          onClick={handleBackdropClick}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-300 ${
            isInquiryOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            ref={modalRef}
            className={`relative w-full max-w-2xl bg-card border border-gold/30 rounded-none shadow-2xl p-6 md:p-10 transition-all duration-300 transform ${
              isInquiryOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={closeInquiry}
              className="absolute top-4 right-4 text-foreground/70 hover:text-gold transition-colors duration-200 p-1"
              aria-label="Close modal"
            >
              <X size={24} strokeWidth={1.5} />
            </button>

            {!isSuccess ? (
              <div>
                <div className="text-center mb-8">
                  <p className="text-gold tracking-[0.3em] text-xs mb-3">EXCLUSIVE CONCIERGE</p>
                  <h2 className="text-3xl font-serif text-white">Make an Inquiry</h2>
                  <div className="h-[1px] w-20 bg-gold/50 mx-auto mt-4"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="fullName" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                        Full Name <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={`w-full bg-background border ${
                          errors.fullName ? 'border-destructive' : 'border-border focus:border-gold'
                        } px-4 py-3 text-sm text-foreground focus:outline-none transition-colors`}
                      />
                      {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                        Email Address <span className="text-gold">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full bg-background border ${
                          errors.email ? 'border-destructive' : 'border-border focus:border-gold'
                        } px-4 py-3 text-sm text-foreground focus:outline-none transition-colors`}
                      />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                        Phone Number <span className="text-gold">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full bg-background border ${
                          errors.phone ? 'border-destructive' : 'border-border focus:border-gold'
                        } px-4 py-3 text-sm text-foreground focus:outline-none transition-colors`}
                      />
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="product" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                        Product of Interest <span className="text-muted-foreground/60">(Optional)</span>
                      </label>
                      <select
                        id="product"
                        name="product"
                        value={formData.product}
                        onChange={handleInputChange}
                        className="w-full bg-background border border-border focus:border-gold px-4 py-3 text-sm text-foreground focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-card">Select Collection / Category</option>
                        <option value="Sunglasses" className="bg-card">Sunglasses</option>
                        <option value="Optical Frames" className="bg-card">Optical Frames</option>
                        <option value="Limited Edition" className="bg-card">Limited Edition</option>
                        <option value="Smart Eyewear" className="bg-card">Smart Eyewear</option>
                        <option value="Custom Bespoke" className="bg-card">Custom Bespoke Design</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                      Subject <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full bg-background border ${
                        errors.subject ? 'border-destructive' : 'border-border focus:border-gold'
                      } px-4 py-3 text-sm text-foreground focus:outline-none transition-colors`}
                    />
                    {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
                      Message <span className="text-gold">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full bg-background border ${
                        errors.message ? 'border-destructive' : 'border-border focus:border-gold'
                      } px-4 py-3 text-sm text-foreground focus:outline-none transition-colors resize-none`}
                    />
                    {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-3 p-3 border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="size-4 mt-0.5 shrink-0" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gold hover:bg-gold-soft text-background py-4 text-xs font-bold tracking-[0.2em] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'SENDING INQUIRY...' : 'SUBMIT INQUIRY'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gold/10 border border-gold rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Check className="text-gold" size={32} />
                </div>
                <h3 className="text-2xl font-serif text-white mb-4">Inquiry Received</h3>
                <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
                  Thank you for contacting us. A Viewora private client advisor will review your inquiry and get in touch with you shortly.
                </p>
                <button
                  onClick={handleResetSuccess}
                  className="bg-transparent border border-gold/50 text-gold px-8 py-3 text-xs font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors duration-300"
                >
                  CLOSE WINDOW
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
