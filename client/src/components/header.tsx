'use client';

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Menu, User, Heart } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";

const nav = [
  { label: "HOME", href: "/#home" },
  { label: "ABOUT", href: "/#about" },
  { label: "COLLECTIONS", href: "/#collections", megaCollections: true },
  { label: "SHOP", href: "/#shop", megaShop: true },
  { label: "SOCIALS", href: "/socials" },
];

const internationalBrands = [
  "Ray-Ban", "Oakley", "Gucci", "Prada",
  "Versace", "Persol", "Tom Ford", "Cartier",
  "Police", "Carrera", "Burberry", "Vogue Eyewear"
];

const shopMenu = [
  {
    title: "Shop by Type",
    items: ["Sunglasses", "Optical Frames", "Reading Glasses", "Blue Light Glasses"]
  },
  {
    title: "Shop by Features",
    items: ["Polarized", "UV Protected", "Anti-Glare", "Photochromic", "Lightweight Frames", "Prescription Ready"]
  },
  {
    title: "Smart Eyewear",
    items: ["Oakley Meta", "Ray-Ban Meta", "Smart Glasses"]
  },
  {
    title: "Shop by Shape",
    items: ["Wayfarer", "Round", "Cat Eye", "Aviator", "Rectangle", "Square"]
  }
];

export default function Header() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src={logoImg} alt="Viewora" className="h-10 w-auto" style={{ width: "auto", height: "auto" }} width={120} height={120} priority />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {nav.map((n) => {
            if (n.megaCollections) {
              return (
                <div key={n.label} className="group relative">
                  <Link href={n.href} className="text-base tracking-[0.15em] font-semibold hover:text-gold transition-colors py-6">
                    {n.label}
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 fixed left-0 right-0 top-[64px] z-50 bg-background border-t border-b border-gold/30 shadow-2xl transition-all duration-300">
                    <div className="max-w-[1400px] mx-auto px-6 py-10">
                      <div className="text-center mb-8">
                        <p className="text-gold tracking-[0.3em] text-sm mb-2">CURATED BRANDS</p>
                        <h4 className="font-serif text-3xl text-white font-normal">International Collections</h4>
                        <div className="h-[1px] w-12 bg-gold/35 mx-auto mt-2"></div>
                      </div>

                      <div className="grid grid-cols-4 gap-x-8 gap-y-6 max-w-4xl mx-auto py-4">
                        {internationalBrands.map((brand) => (
                          <Link
                            key={brand}
                            href={`/shop?brand=${brand.toLowerCase().replace(' ', '-')}`}
                            className="text-base text-foreground font-medium hover:text-gold transition-all duration-200 py-1 hover:translate-x-1 inline-block"
                          >
                            {brand}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-border text-center">
                        <Link
                          href="/shop"
                          className="inline-block border border-gold/50 text-gold hover:bg-gold hover:text-background px-8 py-3 text-xs font-bold tracking-[0.2em] transition-colors duration-300"
                        >
                          VIEW ALL BRANDS
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (n.megaShop) {
              return (
                <div key={n.label} className="group relative">
                  <Link href={n.href} className="text-base tracking-[0.15em] font-semibold hover:text-gold transition-colors py-6">
                    {n.label}
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 fixed left-0 right-0 top-[64px] z-50 bg-background border-t border-b border-gold/30 shadow-2xl transition-all duration-300">
                    <div className="max-w-[1400px] mx-auto px-6 py-10">
                      <div className="grid grid-cols-4 gap-8">
                        {shopMenu.map((cat) => (
                          <div key={cat.title} className="border-l border-gold/10 pl-6 first:border-l-0 first:pl-0 text-left">
                            <h4 className="font-serif text-gold text-xl font-bold mb-4 leading-snug">{cat.title}</h4>
                            <ul className="space-y-2.5 mb-4">
                              {cat.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={`/shop?filter=${item.toLowerCase().replace(' ', '-')}`}
                                    className="text-base text-foreground font-medium hover:text-gold hover:translate-x-0.5 transition-all duration-200 inline-block"
                                  >
                                    {item}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 pt-6 border-t border-border text-center">
                        <Link
                          href="/shop"
                          className="inline-block bg-gold text-background px-8 py-3 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-colors duration-300"
                        >
                          VIEW ALL PRODUCTS
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link key={n.label} href={n.href} className="text-base tracking-[0.15em] font-semibold hover:text-gold transition-colors">
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="block md:hidden text-foreground hover:text-gold transition-colors" aria-label="Open menu">
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-l border-border p-6">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <Image src={logoImg} alt="Viewora" className="h-8 w-auto" style={{ width: "auto", height: "auto" }} width={80} height={80} />
                </div>
                <nav className="flex flex-col gap-1">
                  {nav.map((n) => (
                    <SheetClose key={n.label} asChild>
                      <Link
                        href={n.href}
                        className="text-base tracking-[0.15em] font-semibold text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                      >
                        {n.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href={user ? "/account/profile" : "/login"}
                      className="text-base tracking-[0.15em] font-semibold text-foreground hover:text-gold transition-colors py-3 border-b border-border/50"
                    >
                      {user ? "PROFILE" : "LOGIN"}
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href={user ? "/account/profile" : "/login"} className="hover:text-gold transition-colors" aria-label={user ? "Profile" : "Login"}>
            <User size={28} strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" className="relative hover:text-gold transition-colors" aria-label={`Wishlist with ${wishlistCount} items`}>
            <Heart size={28} strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -right-2.5 -top-2.5 min-w-5 h-5 rounded-full bg-gold px-1 text-[10px] font-bold leading-5 text-background text-center tabular-nums">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative hover:text-gold transition-colors" aria-label={`Cart with ${cartCount} items`}>
            <ShoppingBag size={28} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -right-2.5 -top-2.5 min-w-5 h-5 rounded-full bg-gold px-1 text-[10px] font-bold leading-5 text-background text-center tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
