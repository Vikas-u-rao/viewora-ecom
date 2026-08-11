'use client';

import React, { useState, useEffect, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, Heart, Search, X, Loader2, ShoppingBag } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getApiBaseUrl } from "@/lib/constants";
import { resolveImageUrl } from "@/lib/productImage";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import type { ApiProduct } from "@/services/products";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import view1 from "@/assets/view1.jpg";

const nav = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "THE EDIT", href: "/the-edit", megaEdit: true },
  { label: "SHOP", href: "/shop", megaShop: true },
  { label: "SOCIALS", href: "/socials" },
];

const editorialStories = [
  { title: "The Classics", desc: "Timeless eyewear styles that remain relevant across seasons.", href: "/the-edit/the-classics" },
  { title: "Quiet Luxury", desc: "Understated, refined frames with subtle branding.", href: "/the-edit/quiet-luxury" },
  { title: "Statement Frames", desc: "Bold, oversized and fashion-forward eyewear.", href: "/the-edit/statement-frames" },
  { title: "Executive Edit", desc: "Refined eyewear suitable for formal and business settings.", href: "/the-edit/executive-edit" },
  { title: "Weekend / Everyday", desc: "Versatile frames designed for casual everyday wear.", href: "/the-edit/weekend" },
  { title: "Travel Edit", desc: "Sunglasses and eyewear built for travel and outdoor use.", href: "/the-edit/travel" },
];

const shopMenu = [
  {
    title: "Shop by Type",
    items: [
      { label: "Sunglasses", href: "/shop?filter=sunglasses" },
      { label: "Optical Frames", href: "/shop?filter=optical-frames" }
    ]
  },
  {
    title: "Smart Eyewear",
    items: [
      { label: "Ray-Ban Meta", href: "/shop?brand=ray-ban-meta" },
      { label: "Smart Glasses", href: "/shop?filter=smart-glasses" }
    ]
  },
  {
    title: "Shop by Shape",
    items: [
      { label: "Wayfarer", href: "/shop?shape=wayfarer" },
      { label: "Aviator", href: "/shop?shape=aviator" },
      { label: "Round", href: "/shop?shape=round" },
      { label: "Clubmaster", href: "/shop?shape=clubmaster" },
      { label: "D-Frame", href: "/shop?shape=d-frame" },
      { label: "Mask", href: "/shop?shape=mask" },
      { label: "Sports", href: "/shop?shape=sports" }
    ]
  },
  {
    title: "Shop by Brand",
    items: [
      { label: "Ray-Ban", href: "/shop?brand=ray-ban" },
      { label: "Oakley", href: "/shop?brand=oakley" },
      { label: "Carrera", href: "/shop?brand=carrera" },
      { label: "Gucci", href: "/shop?brand=gucci" },
      { label: "Prada", href: "/shop?brand=prada" },
      { label: "Versace", href: "/shop?brand=versace" },
      { label: "Tom Ford", href: "/shop?brand=tom-ford" },
      { label: "Persol", href: "/shop?brand=persol" }
    ]
  }
];

export default function Header() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState<ApiProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!searchVal.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${getApiBaseUrl()}/products?search=${encodeURIComponent(searchVal.trim())}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.error("Search fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchVal]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
      setShowSearch(false);
      setSearchVal("");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#000]/95 backdrop-blur border-b border-[#2E2820]">
      {showSearch && (
        <div className="fixed inset-x-0 top-0 z-[60] bg-[#000]/98 backdrop-blur-md border-b border-gold/20 py-6 px-6 shadow-2xl animate-fade-in">
          <div className="max-w-[1000px] mx-auto flex items-start justify-between gap-4">
            <div className="flex-1 relative">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3" role="search" aria-label="Search Viewora eyewear">
                <Search className="text-gold" size={24} strokeWidth={1.5} aria-hidden="true" />
                <input
                  id="site-search"
                  type="search"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search Viewora eyewear..."
                  aria-label="Search eyewear"
                  aria-autocomplete="list"
                  aria-controls="search-results"
                  className="flex-1 bg-transparent text-xl text-[#FAD6E3] border-none outline-none placeholder:text-[#FAD6E3]/60 focus:ring-0 focus:outline-none font-sans"
                  autoFocus
                />
              </form>

              {searchVal.trim() && (
                <div id="search-results" className="absolute left-0 right-0 top-full mt-5 bg-[#0d0b09]/95 backdrop-blur-md border border-[#2E2820] shadow-2xl rounded-md max-h-[450px] overflow-y-auto z-50 p-4 text-[#FAD6E3] text-left" role="listbox" aria-label="Search results">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6 text-sm text-[#FAD6E3]/80">
                      <Loader2 className="size-4 animate-spin text-gold mr-2" />
                      Searching Viewora catalog...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-6 text-sm text-[#FAD6E3]/80 font-sans">
                      No items found matching &quot;<span className="text-[#FAD6E3] font-medium">{searchVal}</span>&quot;
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] tracking-widest text-[#FAD6E3]/70 uppercase font-bold">Suggested Products</p>
                      <div className="divide-y divide-[#2E2820]">
                        {searchResults.map((prod) => (
                          <Link
                            key={prod.id}
                            href={`/products/${prod.slug}`}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchVal("");
                            }}
                            className="flex items-center gap-4 py-3 hover:bg-white/5 transition-colors group cursor-pointer"
                          >
                            {resolveImageUrl(prod.defaultImageUrls?.[0]) && (
                              <Image
                                src={resolveImageUrl(prod.defaultImageUrls[0])!}
                                alt={prod.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover border border-[#2E2820] bg-card flex-shrink-0"
                              />
                            )}
                            <div className="flex-1">
                              {prod.brand && <span className="text-[9px] tracking-wider text-gold font-bold uppercase">{prod.brand}</span>}
                              <h4 className="text-sm font-sans text-[#FAD6E3] group-hover:text-gold transition-colors font-medium -mt-0.5">{prod.name}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-sans text-[#FAD6E3] font-semibold">₹{Number(prod.startingPrice).toLocaleString("en-IN")}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => {
                          router.push(`/shop?search=${encodeURIComponent(searchVal.trim())}`);
                          setShowSearch(false);
                          setSearchVal("");
                        }}
                        className="w-full text-center py-2.5 mt-2 border border-gold/40 text-gold hover:bg-gold hover:text-background text-xs font-bold tracking-widest transition-all cursor-pointer block uppercase"
                        type="button"
                      >
                        View More Results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => { setShowSearch(false); setSearchVal(""); }} 
              className="text-[#FAD6E3] hover:text-gold transition-colors cursor-pointer self-start mt-1.5"
              type="button"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <button className="block md:hidden text-[#FAD6E3] hover:text-gold transition-colors p-1" aria-label="Open menu">
                <Menu size={24} strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-72 bg-[#000] border-r border-[#2E2820] p-6">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <Image src={logoImg} alt="Viewora" className="h-7 w-auto" style={{ width: "auto", height: "auto" }} width={80} height={80} />
                </div>
                <nav className="flex flex-col gap-1 overflow-y-auto">
                  {nav.map((n) => (
                    <Fragment key={n.label}>
                      <SheetClose asChild>
                        <Link
                          href={n.href}
                          className="text-sm sm:text-base tracking-[0.15em] font-semibold text-[#FAD6E3] hover:text-gold transition-colors py-3 border-b border-[#2E2820]"
                        >
                          {n.label}
                        </Link>
                      </SheetClose>
                      {n.megaEdit && (
                        <div className="pl-2 py-2 border-b border-[#2E2820]/60 flex flex-col gap-1 bg-white/5 rounded-lg my-1.5">
                          {editorialStories.map((story) => (
                            <SheetClose key={story.title} asChild>
                              <Link
                                href={story.href}
                                className="group/mob py-2 px-3 rounded-md hover:bg-white/10 transition-all flex items-center justify-between w-full cursor-pointer text-left"
                              >
                                <span className="font-serif text-xs font-medium text-gold group-hover/mob:text-gold-soft transition-colors">
                                  {story.title}
                                </span>
                                <span className="text-gold text-xs font-sans group-hover/mob:translate-x-1 transition-transform">
                                  &rarr;
                                </span>
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      )}
                    </Fragment>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href={user ? "/account/profile" : "/login"}
                      className="text-sm sm:text-base tracking-[0.15em] font-semibold text-[#FAD6E3] hover:text-gold transition-colors py-3 border-b border-[#2E2820]"
                    >
                      {user ? "PROFILE" : "LOGIN"}
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center justify-center shrink-0 leading-none group py-1" aria-label="Viewora home">
            <Image
              src={logoImg}
              alt="Viewora"
              className="h-7 sm:h-9 w-auto max-w-[100px] sm:max-w-[130px] object-contain filter drop-shadow-md brightness-110"
              width={130}
              height={36}
              priority
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-5 lg:gap-8">
          {nav.map((n) => {
            if (n.megaEdit) {
              return (
                <div key={n.label} className="group relative">
                  <Link href={n.href} className={`text-xs lg:text-sm tracking-[0.15em] font-semibold transition-colors ${isActiveLink(n.href) ? "text-gold" : "text-[#FAD6E3] hover:text-gold"}`}>
                    {n.label}
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 fixed left-0 right-0 top-[72px] z-50 bg-[#000]/98 backdrop-blur-xl border-t border-b border-gold/30 shadow-2xl transition-all duration-300">
                    <div className="max-w-[1400px] mx-auto px-8 py-8">
                      <div className="grid grid-cols-12 gap-8 items-center">
                        {/* Left: Curated Stories List */}
                        <div className="col-span-7 pr-6 border-r border-[#2E2820] text-left">
                          <div className="mb-4">
                            <p className="text-gold tracking-[0.3em] text-xs font-semibold uppercase mb-1">THE VIEWORA EDIT</p>
                            <h4 className="font-serif text-2xl text-[#FAD6E3] font-normal">Curated Stories</h4>
                            <div className="h-[1px] w-12 bg-gold/35 mt-2"></div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                            {editorialStories.map((story) => (
                              <Link
                                key={story.title}
                                href={story.href}
                                className="group/item block p-3 rounded-lg bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-gold/20 transition-all duration-200 cursor-pointer"
                              >
                                <h5 className="font-serif text-base text-gold group-hover/item:text-gold-soft transition-colors font-medium mb-1 flex items-center justify-between">
                                  <span>{story.title}</span>
                                  <span className="text-xs font-sans text-gold group-hover/item:translate-x-1 transition-transform inline-block">
                                    &rarr;
                                  </span>
                                </h5>
                                <p className="text-xs text-[#FAD6E3]/70 font-sans leading-relaxed line-clamp-2 font-light">
                                  {story.desc}
                                </p>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Right: Featured Editorial Spotlight */}
                        <div className="col-span-5 flex flex-col justify-between">
                          <Link
                            href="/the-edit/quiet-luxury"
                            className="group/spotlight relative block overflow-hidden rounded-xl border border-gold/20 bg-black shadow-2xl aspect-[16/10]"
                          >
                            <Image
                              src={colLtd}
                              alt="Quiet Luxury Editorial"
                              width={600}
                              height={375}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/spotlight:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end text-left">
                              <span className="text-[10px] tracking-[0.25em] text-gold uppercase font-semibold mb-1">FEATURED STORY</span>
                              <h5 className="font-serif text-xl text-white font-medium mb-1">Quiet Luxury</h5>
                              <p className="text-xs text-[#FAD6E3]/80 font-sans mb-3">Refined eyewear, carefully selected.</p>
                              <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase group-hover/spotlight:translate-x-1 transition-transform inline-flex items-center gap-1">
                                EXPLORE &rarr;
                              </span>
                            </div>
                          </Link>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#2E2820] text-center">
                        <Link
                          href="/the-edit"
                          className="inline-block border border-gold/50 text-gold hover:bg-gold hover:text-background px-8 py-2.5 text-xs font-bold tracking-[0.2em] transition-colors duration-300 uppercase"
                        >
                          EXPLORE THE EDIT
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
                  <Link href={n.href} className={`text-xs lg:text-sm tracking-[0.15em] font-semibold transition-colors ${isActiveLink(n.href) ? "text-gold" : "text-[#FAD6E3] hover:text-gold"}`}>
                    {n.label}
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 fixed left-0 right-0 top-[72px] z-50 bg-[#000] border-t border-b border-gold/30 shadow-2xl transition-all duration-300">
                    <div className="max-w-[1400px] mx-auto px-6 py-10">
                      <div className="grid grid-cols-4 gap-8">
                        {shopMenu.map((cat) => (
                          <div key={cat.title} className="border-l border-gold/10 pl-6 first:border-l-0 first:pl-0 text-left">
                            <h4 className="font-serif text-gold text-xl font-bold mb-4 leading-snug">{cat.title}</h4>
                            <ul className="space-y-2.5 mb-4">
                              {cat.items.map((item) => (
                                <li key={item.label}>
                                  <Link
                                    href={item.href}
                                    className="text-base text-[#FAD6E3] font-medium hover:text-gold hover:translate-x-0.5 transition-all duration-200 inline-block"
                                  >
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 pt-6 border-t border-[#2E2820] text-center">
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
              <Link key={n.label} href={n.href} className={`text-xs lg:text-sm tracking-[0.15em] font-semibold transition-colors ${isActiveLink(n.href) ? "text-gold" : "text-[#FAD6E3] hover:text-gold"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <button 
            onClick={() => setShowSearch(true)} 
            className="hover:text-gold text-[#FAD6E3] transition-colors cursor-pointer flex items-center justify-center p-1" 
            aria-label="Open Search"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
          </button>
          <Link href={user ? "/account/profile" : "/login"} className="text-[#FAD6E3] hover:text-gold transition-colors p-1" aria-label={user ? "Profile" : "Login"}>
            <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" className="relative text-[#FAD6E3] hover:text-gold transition-colors p-1" aria-label={`Wishlist with ${wishlistCount} items`}>
            <Heart className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 sm:min-w-5 sm:h-5 rounded-full bg-gold px-1 text-[9px] sm:text-[10px] font-bold leading-4 sm:leading-5 text-background text-center tabular-nums">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative text-[#FAD6E3] hover:text-gold transition-colors p-1" aria-label={`Cart with ${cartCount} items`}>
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 sm:min-w-5 sm:h-5 rounded-full bg-gold px-1 text-[9px] sm:text-[10px] font-bold leading-4 sm:leading-5 text-background text-center tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

