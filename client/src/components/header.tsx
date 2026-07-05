'use client';

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import logoImg from "@/assets/logo.png";

const nav = [
  { label: "HOME", href: "/#home" },
  { label: "COLLECTIONS", href: "/#collections", mega: true },
  { label: "ABOUT", href: "/#about" },
  { label: "CONTACT", href: "/#contact" },
];

const utilityNav = [
  { label: "LOGIN", href: "/#login" },
];

const megaCategories = [
  {
    slug: "premium-sunglasses",
    title: "Premium International Brands Sunglasses",
    items: [
      "Rayban Metal Sunglasses",
      "Police Black Sunglass",
      "FILA Fancy Sunglasses",
      "Polaroid Unisex Sunglasses",
      "Allen Solly WAYFARER Sunglasses",
    ],
  },
  {
    slug: "signature-eyewear",
    title: "Jaiswal Opticals Signature Eyewear",
    items: [
      "Jaiswal Opticals Brands Eyeglass Frame",
      "Jacob Marin Ladies Eyewear Eyeglass Frame",
      "GERMAN PHILLIPE Wooden Sunglasses",
      "IGO Eyewear Titanium Rimless Eyeglass Frame",
      "Jacob Marin Polarized Eyeglass Frame",
    ],
  },
  {
    slug: "luxury-eyewear",
    title: "Luxury Branded Eyewear",
    items: [
      "Maybach Premium Eyewear Sunglasses",
      "Mont Blanc Rimless Eye Frames Sunglasses",
      "Silhouette 23K Golden Sunglasses",
      "Versace Premium Sunglasses",
      "Cutler Gross Sunglasses",
    ],
  },
  {
    slug: "premium-eyewear",
    title: "Premium International Brand Eyewear",
    items: [
      "Tommy Hilfiger Eyeglasses",
      "Emporio Armani Clip on Eyeglasses",
      "Rayban Unisex Eyewear",
      "Jimmy Choo Sunglasses",
      "Montblanc Eyewear Sunglasses",
    ],
  },
];

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src={logoImg} alt="Viewora" className="h-12 md:h-14 w-auto" width={112} height={112} priority />
        </Link>
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {nav.map((n) =>
            n.mega ? (
              <div key={n.label} className="group relative">
                <Link href={n.href} className="text-sm tracking-[0.15em] font-medium hover:text-gold transition-colors py-6">
                  {n.label}
                </Link>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 fixed left-0 right-0 top-[64px] md:top-[68px] bg-background border-t border-b border-gold/30 shadow-2xl">
                  <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                      {megaCategories.map((cat) => (
                        <div key={cat.title}>
                          <h4 className="font-serif text-gold text-lg mb-4 leading-snug">{cat.title}</h4>
                          <ul className="space-y-2.5 mb-4">
                            {cat.items.map((it) => (
                              <li key={it}>
                                <Link href={`/shop/${cat.slug}`} className="text-sm text-foreground/85 hover:text-gold transition-colors">
                                  {it}
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <Link href={`/shop/${cat.slug}`} className="text-sm tracking-[0.2em] text-gold border-b border-gold/50 hover:border-gold pb-0.5">
                            VIEW ALL PRODUCTS
                          </Link>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-border">
                      <Link href="/#collections" className="inline-block bg-gold text-background px-6 py-2.5 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-colors">
                        VIEW ALL CATEGORIES
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link key={n.label} href={n.href} className="text-sm tracking-[0.15em] font-medium hover:text-gold transition-colors">
                {n.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {utilityNav.map((n) => (
            <Link key={n.label} href={n.href} className="text-sm tracking-[0.15em] font-medium hover:text-gold transition-colors">
              {n.label}
            </Link>
          ))}
          <Link href="/#cart" className="hover:text-gold transition-colors" aria-label="Cart">
            <ShoppingCart size={20} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}
