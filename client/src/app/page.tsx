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

// Import style images
import wayfarerImg from "@/assets/styles/wayfarer.png";
import aviatorImg from "@/assets/styles/aviator.png";
import cateyeImg from "@/assets/styles/cateye.png";
import roundImg from "@/assets/styles/round.png";
import rectangleImg from "@/assets/styles/rectangle.png";
import squareImg from "@/assets/styles/square.png";
import rimlessImg from "@/assets/styles/rimless.png";
import semirimlessImg from "@/assets/styles/semirimless.png";
import oversizedImg from "@/assets/styles/oversized.png";
import geometricImg from "@/assets/styles/geometric.png";

const nav = [
  { label: "HOME", href: "/#home" },
  { label: "ABOUT", href: "/#about" },
  { label: "COLLECTIONS", href: "/#collections" },
  { label: "SHOP", href: "/#shop" },
  { label: "SOCIALS", href: "/socials" },
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

const frameStyles = [
  { name: "Wayfarer", img: wayfarerImg, slug: "wayfarer" },
  { name: "Aviator", img: aviatorImg, slug: "aviator" },
  { name: "Cat Eye", img: cateyeImg, slug: "cat-eye" },
  { name: "Round", img: roundImg, slug: "round" },
  { name: "Rectangle", img: rectangleImg, slug: "rectangle" },
  { name: "Square", img: squareImg, slug: "square" },
  { name: "Rimless", img: rimlessImg, slug: "rimless" },
  { name: "Semi-Rimless", img: semirimlessImg, slug: "semi-rimless" },
  { name: "Oversized", img: oversizedImg, slug: "oversized" },
  { name: "Geometric", img: geometricImg, slug: "geometric" },
];

export default function Home() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in duration-300">
      <Header />

      {/* Hero Section - Split Layout */}
      <section id="home" className="relative min-h-screen grid grid-cols-1 md:grid-cols-2 pt-20 bg-background overflow-hidden">
        {/* Left side: Eyewear Image */}
        <div className="relative w-full h-[50vh] md:h-[calc(100vh-80px)] flex items-center justify-center bg-black/20 border-r border-border/30">
          <Image 
            src={heroImg} 
            alt="Hero Banner Eyewear" 
            className="object-cover w-full h-full scale-x-[-1]" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/30" />
        </div>

        {/* Right side: Hero Text */}
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 md:py-0 text-left max-w-2xl mx-auto md:mx-0">
          <p className="text-gold tracking-[0.35em] text-xs md:text-sm mb-6 font-medium">FASHION EYEWEAR</p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-normal leading-[1.1] mb-6 text-white">
            See the World in <span className="text-gold font-bold italic drop-shadow-[0_2px_10px_rgba(197,160,89,0.35)] animate-pulse">Gold</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed font-light font-sans">
            Luxury eyewear crafted with premium materials, designed for everyday comfort and timeless elegance.
          </p>
          <div className="flex items-center">
            <a href="#collections" className="bg-gold text-background px-10 py-4 text-xs font-bold tracking-[0.15em] hover:bg-gold-soft transition-all duration-300 hover:shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:-translate-y-0.5 text-center">
              SHOP COLLECTION
            </a>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="py-24 md:py-32 px-6 lg:px-8 bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14 md:mb-18">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">OUR COLLECTIONS</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal">Crafted for Every Look</h2>
            <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {collections.map((c) => (
              <Link key={c.title} href={`/shop/${c.slug}`} className="group relative overflow-hidden aspect-[4/5] block border border-border/40">
                <Image src={c.img} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" width={800} height={900} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl text-gold mb-2">{c.title}</h3>
                  <p className="text-sm text-white/80 mb-4 max-w-[85%] leading-relaxed font-sans">{c.desc}</p>
                  <span className="text-sm tracking-[0.2em] text-white">VIEW COLLECTION →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Frame Styles Section (Replacing Best Sellers) */}
      <section id="shop" className="py-24 md:py-32 px-6 lg:px-8 border-t border-border bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14 md:mb-18">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">CURATED DESIGNS</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal">Shop by Frame Style</h2>
            <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {frameStyles.map((s) => (
              <Link
                key={s.name}
                href={`/shop?shape=${s.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden border border-border/50 hover:border-gold transition-colors duration-500 bg-black"
              >
                <Image
                  src={s.img}
                  alt={s.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
                  <h3 className="text-xl font-serif text-white mb-2 group-hover:text-gold transition-colors">{s.name}</h3>
                  <span className="text-xs tracking-[0.2em] text-gold uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    EXPLORE →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 md:py-32 px-6 lg:px-8 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <Image src={logoImg} alt="Viewora" className="h-20 md:h-28 w-auto mx-auto mb-10" loading="lazy" width={224} height={224} />
          <p className="text-lg md:text-xl lg:text-2xl font-serif leading-relaxed text-muted-foreground">
            At <span className="text-gold">Viewora</span>, every frame is designed to be more than an accessory — it&apos;s a statement of style, confidence, and timeless luxury. Our eyewear blends contemporary design with premium craftsmanship, made for those who see life with clarity and class.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="contact" className="py-24 md:py-32 px-6 lg:px-8 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl mb-4">
            Join the <span className="text-gold">Viewora</span> Community
          </h2>
          <p className="text-muted-foreground mb-8 text-lg font-sans">Subscribe for exclusive offers, early access, and style updates.</p>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-16 md:pt-20 pb-8 px-6 lg:px-8 bg-background">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-3 gap-12 lg:gap-16 mb-12 md:mb-16">
          <div>
            <Image src={logoImg} alt="Viewora" className="h-16 md:h-20 w-auto mb-6" loading="lazy" width={160} height={160} />
            <p className="text-muted-foreground max-w-xs leading-relaxed font-sans">
              Premium fashion eyewear crafted for elegance, comfort, and bold individuality.
            </p>
          </div>
          <div>
            <h4 className="text-gold tracking-[0.2em] text-sm mb-5 font-sans font-semibold">QUICK LINKS</h4>
            <ul className="space-y-3 font-sans">
              {nav.map((n) => (
                <li key={n.label}>
                  <Link href={n.href} className="text-foreground hover:text-gold transition-colors">
                    {n.label.charAt(0) + n.label.slice(1).toLowerCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-gold tracking-[0.2em] text-sm mb-5 font-sans font-semibold">CONTACT</h4>
            <ul className="space-y-3 text-foreground font-sans">
              <li>support@viewora.in</li>
              <li>+1 (555) 234-5678</li>
              <li>Mon – Sat, 10am – 7pm</li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto border-t border-border pt-8 text-center text-xs tracking-[0.2em] text-muted-foreground font-sans">
          © 2026 VIEWORA — FASHION EYEWEAR. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
