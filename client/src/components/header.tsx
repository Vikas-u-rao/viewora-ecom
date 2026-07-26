'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, Heart, Search, X, Loader2, ShoppingBag } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getApiBaseUrl } from "@/lib/constants";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import type { ApiProduct } from "@/services/products";

const nav = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/about" },
  { label: "COLLECTIONS", href: "/collections", megaCollections: true },
  { label: "SHOP", href: "/shop", megaShop: true },
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
                            {prod.defaultImageUrls?.[0] && (
                              <Image
                                src={prod.defaultImageUrls[0]}
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

      <div className="max-w-[1400px] mx-auto px-6 h-[72px] grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="flex flex-col items-center justify-center shrink-0 leading-none group py-1 text-center" aria-label="Viewora home">
          <Image
            src={logoImg}
            alt="Viewora"
            className="h-8 sm:h-9 w-auto max-w-[130px] object-contain filter drop-shadow-md brightness-110 mx-auto"
            width={130}
            height={36}
            priority
          />
          <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.35em] text-gold/80 uppercase mt-0.5 text-center">
            FASHION EYEWEAR
          </span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-6">
          {nav.map((n) => {
            if (n.megaCollections) {
              return (
                <div key={n.label} className="group relative">
                  <Link href={n.href} className={`text-base tracking-[0.15em] font-semibold transition-colors ${isActiveLink(n.href) ? "text-gold" : "text-[#FAD6E3] hover:text-gold"}`}>
                    {n.label}
                  </Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 fixed left-0 right-0 top-[72px] z-50 bg-[#000] border-t border-b border-gold/30 shadow-2xl transition-all duration-300">
                    <div className="max-w-[1400px] mx-auto px-6 py-10">
                      <div className="text-center mb-8">
                        <p className="text-gold tracking-[0.3em] text-sm mb-2">CURATED BRANDS</p>
                        <h4 className="font-serif text-3xl text-[#FAD6E3] font-normal">International Collections</h4>
                        <div className="h-[1px] w-12 bg-gold/35 mx-auto mt-2"></div>
                      </div>

                      <div className="grid grid-cols-4 gap-x-8 gap-y-6 max-w-4xl mx-auto py-4">
                        {internationalBrands.map((brand) => (
                          <Link
                            key={brand}
                            href={`/shop?brand=${brand.toLowerCase().replace(' ', '-')}`}
                            className="text-base text-[#FAD6E3] font-medium hover:text-gold transition-all duration-200 py-1 hover:translate-x-1 inline-block"
                          >
                            {brand}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#2E2820] text-center">
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
                  <Link href={n.href} className={`text-base tracking-[0.15em] font-semibold transition-colors ${isActiveLink(n.href) ? "text-gold" : "text-[#FAD6E3] hover:text-gold"}`}>
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
                                <li key={item}>
                                  <Link
                                    href={`/shop?filter=${item.toLowerCase().replace(' ', '-')}`}
                                    className="text-base text-[#FAD6E3] font-medium hover:text-gold hover:translate-x-0.5 transition-all duration-200 inline-block"
                                  >
                                    {item}
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
              <Link key={n.label} href={n.href} className={`text-base tracking-[0.15em] font-semibold transition-colors ${isActiveLink(n.href) ? "text-gold" : "text-[#FAD6E3] hover:text-gold"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <button className="block md:hidden text-[#FAD6E3] hover:text-gold transition-colors" aria-label="Open menu">
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#000] border-l border-[#2E2820] p-6">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <Image src={logoImg} alt="Viewora" className="h-8 w-auto" style={{ width: "auto", height: "auto" }} width={80} height={80} />
                </div>
                <nav className="flex flex-col gap-1">
                  {nav.map((n) => (
                    <SheetClose key={n.label} asChild>
                      <Link
                        href={n.href}
                        className="text-base tracking-[0.15em] font-semibold text-[#FAD6E3] hover:text-gold transition-colors py-3 border-b border-[#2E2820]"
                      >
                        {n.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href={user ? "/account/profile" : "/login"}
                      className="text-base tracking-[0.15em] font-semibold text-[#FAD6E3] hover:text-gold transition-colors py-3 border-b border-[#2E2820]"
                    >
                      {user ? "PROFILE" : "LOGIN"}
                    </Link>
                  </SheetClose>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <button 
            onClick={() => setShowSearch(true)} 
            className="hover:text-gold text-[#FAD6E3] transition-colors cursor-pointer flex items-center justify-center" 
            aria-label="Open Search"
          >
            <Search size={28} strokeWidth={1.5} />
          </button>
          <Link href={user ? "/account/profile" : "/login"} className="text-[#FAD6E3] hover:text-gold transition-colors" aria-label={user ? "Profile" : "Login"}>
            <User size={28} strokeWidth={1.5} />
          </Link>
          <Link href="/wishlist" className="relative text-[#FAD6E3] hover:text-gold transition-colors" aria-label={`Wishlist with ${wishlistCount} items`}>
            <Heart size={28} strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -right-2.5 -top-2.5 min-w-5 h-5 rounded-full bg-gold px-1 text-[10px] font-bold leading-5 text-background text-center tabular-nums">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative text-[#FAD6E3] hover:text-gold transition-colors" aria-label={`Cart with ${cartCount} items`}>
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

