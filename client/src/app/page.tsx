'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";

// Import assets
import heroImg from "@/assets/hero.jpg";
import logoImg from "@/assets/logo.png";
import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
const nav = [
  { label: "HOME", href: "#home" },
  { label: "COLLECTIONS", href: "#collections", mega: true },
  { label: "ABOUT", href: "#about" },
  { label: "CONTACT", href: "#contact" },
];

const collections = [
  {
    title: "Sunglasses",
    desc: "Bold, sun-ready frames for every face and every occasion.",
    img: colSun,
    slug: "sunglasses",
  },
  {
    title: "Optical Frames",
    desc: "Refined prescription frames designed for clarity and comfort.",
    img: colOpt,
    slug: "optical-frames",
  },
  {
    title: "Limited Edition",
    desc: "Rare, small-batch pieces reserved for the true collector.",
    img: colLtd,
    slug: "limited-edition",
  },
];

const products = [
  { name: "Aurelia Aviator", price: "₹1890", img: p1 },
  { name: "Noir Round", price: "₹1590", img: p2 },
  { name: "Golden Cat-Eye", price: "₹2100", img: p3 },
  { name: "Classic Wayfarer", price: "₹1750", img: p4 },
];

export default function Home() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section id="home" className="relative min-h-screen flex items-center justify-center pt-20">
        <Image src={heroImg} alt="Hero Banner" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} priority />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <p className="text-gold tracking-[0.35em] text-sm mb-6">FASHION EYEWEAR</p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal leading-[1.05] mb-8 text-white">
            See the World in Style
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Luxury eyewear crafted with premium materials, designed for everyday comfort and timeless elegance.
          </p>
          <div className="flex items-center justify-center">
            <a href="#collections" className="bg-gold text-background px-8 py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors">
              SHOP COLLECTION
            </a>
          </div>
        </div>
      </section>

      <section id="collections" className="py-24 md:py-32 px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14 md:mb-18">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">OUR COLLECTIONS</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal">Crafted for Every Look</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {collections.map((c) => (
              <Link key={c.title} href={`/shop/${c.slug}`} className="group relative overflow-hidden aspect-[4/5] block">
                <Image src={c.img} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" width={800} height={900} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl text-gold mb-2">{c.title}</h3>
                  <p className="text-sm text-white/80 mb-4 max-w-[85%] leading-relaxed">{c.desc}</p>
                  <span className="text-sm tracking-[0.2em] text-white">VIEW COLLECTION →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="shop" className="py-24 md:py-32 px-6 lg:px-8 border-t border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14 md:mb-18">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">BEST SELLERS</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal">Featured Frames</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {products.map((p) => (
              <div key={p.name} className="border border-border p-4 hover:border-gold transition-colors">
                <div className="aspect-square overflow-hidden mb-5 relative w-full h-[250px]">
                  <Image src={p.img} alt={p.name} className="w-full h-full object-cover" loading="lazy" fill />
                </div>
                <h3 className="text-lg font-serif mb-3">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gold text-lg">{p.price}</span>
                  <button className="border border-gold text-gold px-4 py-1.5 text-xs font-bold tracking-[0.15em] hover:bg-gold hover:text-background transition-colors">
                    ADD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 md:py-32 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Image src={logoImg} alt="Viewora" className="h-20 md:h-28 w-auto mx-auto mb-10" loading="lazy" width={224} height={224} />
          <p className="text-lg md:text-xl lg:text-2xl font-serif leading-relaxed text-muted-foreground">
            At <span className="text-gold">Viewora</span>, every frame is designed to be more than an accessory — it&apos;s a statement of style, confidence, and timeless luxury. Our eyewear blends contemporary design with premium craftsmanship, made for those who see life with clarity and class.
          </p>
        </div>
      </section>

      <section id="contact" className="py-24 md:py-32 px-6 lg:px-8 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl mb-4">
            Join the <span className="text-gold">Viewora</span> Circle
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">Subscribe for exclusive offers, early access, and style updates.</p>
          <form onSubmit={(e) => { e.preventDefault(); setEmail(""); }} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 bg-input border border-border px-5 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
            />
            <button type="submit" className="bg-gold text-background px-8 py-3.5 text-sm font-bold tracking-[0.15em] hover:bg-gold-soft transition-colors">
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-border pt-16 md:pt-20 pb-8 px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-3 gap-12 lg:gap-16 mb-12 md:mb-16">
          <div>
            <Image src={logoImg} alt="Viewora" className="h-16 md:h-20 w-auto mb-6" loading="lazy" width={160} height={160} />
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              Premium fashion eyewear crafted for elegance, comfort, and bold individuality.
            </p>
          </div>
          <div>
            <h4 className="text-gold tracking-[0.2em] text-sm mb-5 font-sans font-semibold">QUICK LINKS</h4>
            <ul className="space-y-3">
              {nav.map((n) => (
                <li key={n.label}>
                  <a href={n.href} className="text-foreground hover:text-gold transition-colors">
                    {n.label.charAt(0) + n.label.slice(1).toLowerCase()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-gold tracking-[0.2em] text-sm mb-5 font-sans font-semibold">CONTACT</h4>
            <ul className="space-y-3 text-foreground">
              <li>support@viewora.com</li>
              <li>+1 (555) 234-5678</li>
              <li>Mon – Sat, 10am – 7pm</li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto border-t border-border pt-8 text-center text-xs tracking-[0.2em] text-muted-foreground">
          © 2026 VIEWORA — FASHION EYEWEAR. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
