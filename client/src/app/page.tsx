"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import view1 from "@/assets/view1.jpg";
import view2 from "@/assets/view2.jpg";
import view3 from "@/assets/view3.jpg";
import view4 from "@/assets/view4.jpg";
import logo from "@/assets/logo.png"
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
  const slides = [view1, view2, view3, view4];
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in duration-300">
      <Header />

      {/* Hero Section - Full Background Layout */}
      <section
        id="main-content"
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-black"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Full Screen Background Image Slideshow — CSS crossfade, all slides stay in DOM */}
        <div className="absolute inset-0 w-full h-full">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeSlide ? "opacity-50" : "opacity-0"}`}
            >
              <Image
                src={slide}
                alt={`Viewora Campaign ${idx + 1}`}
                className="object-cover w-full h-full"
                priority={idx === 0}
                loading={idx === 0 ? 'eager' : 'lazy'}
                fill
                sizes="100vw"
                quality={75}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/60 z-[2]" />
        </div>

        {/* Slide dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? "bg-gold w-6" : "bg-white/30 w-1.5"
                }`}
            />
          ))}
        </div>

        {/* Centered Hero Text */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-gold tracking-[0.4em] text-xs mb-6 font-semibold uppercase">FASHION EYEWEAR</p>
          <h1 className="font-serif text-5xl lg:text-6xl font-normal leading-[1.15] mb-8 text-white">
            See the World in <span className="text-gold font-bold italic drop-shadow-[0_0_20px_rgba(197,160,89,0.65)] motion-safe:animate-pulse">GOLD</span>
          </h1>
          <p className="text-base text-white/95 mb-12 leading-relaxed font-light max-w-2xl mx-auto font-sans">
            Luxury eyewear crafted with premium materials, designed for everyday comfort and timeless elegance.
          </p>
          <div className="flex justify-center">
            <Link href="/shop" className="bg-gold text-background px-12 py-4.5 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-all duration-300 hover:shadow-[0_0_30px_rgba(197,160,89,0.45)] hover:-translate-y-0.5 text-center">
              SHOP NOW
            </Link>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="py-20 px-6 bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">OUR COLLECTIONS</p>
            <h2 className="text-4xl font-normal">Crafted for Every Look</h2>
            <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((c) => (
              <Link key={c.title} href={`/collections/${c.slug}`} className="group relative overflow-hidden aspect-[4/5] block border border-border/40">
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
      {/* Frame Styles Section */}
      <section id="shop" className="py-20 px-6 border-t border-border bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">CURATED DESIGNS</p>
            <h2 className="text-4xl font-normal">Shop by Frame Style</h2>
            <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4"></div>
          </div>
          <Carousel opts={{ align: "start", loop: true }} className="px-4">
            <CarouselContent>
              {frameStyles.map((s) => (
                <CarouselItem key={s.name} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <Link
                    href={`/shop?shape=${s.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden border border-border/50 hover:border-gold transition-colors duration-500 bg-black"
                  >
                    <Image
                      src={s.img}
                      alt={s.name}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
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
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="flex -left-4 bg-background/80 border-border hover:bg-background" />
            <CarouselNext className="flex -right-4 bg-background/80 border-border hover:bg-background" />
          </Carousel>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-background relative overflow-hidden">
        {/* Subtle radial gold glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="mb-8 inline-block">
            <Image src={logo} alt="Viewora" className="h-28 w-auto mx-auto" style={{ width: "auto", height: "auto" }} loading="lazy" width={288} height={288} />
          </div>
          <div className="h-[1px] w-20 bg-gold/30 mx-auto mb-8" />
          <p className="text-xl font-serif leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-8">
            At <span className="text-gold font-semibold">Viewora</span>, every frame is a statement of timeless style, crafted for those who see life with clarity and class.
          </p>
          <Link href="/about" className="inline-block border border-gold/40 text-gold px-8 py-3 text-xs font-bold tracking-[0.2em] hover:bg-gold hover:text-black transition-all uppercase">
            Read Our Story &rarr;
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="contact" className="py-20 px-6 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl mb-4 font-serif">
            Join the <span className="text-gold font-bold drop-shadow-[0_0_15px_rgba(197,160,89,0.85)] motion-safe:animate-pulse uppercase">Viewora</span> Community
          </h2>
          <p className="text-muted-foreground mb-8 text-lg font-sans">Subscribe for exclusive offers, early access, and style updates.</p>
          <NewsletterForm />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
