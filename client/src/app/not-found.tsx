import Link from "next/link";
import Image from "next/image";
import logoImg from "@/assets/logo.png";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo */}
        <Link href="/" className="inline-block mb-10">
          <Image
            src={logoImg}
            alt="Viewora"
            width={180}
            height={60}
            className="w-auto h-12 mx-auto"
            style={{ width: "auto", height: "auto" }}
          />
        </Link>

        {/* 404 Code */}
        <p className="text-gold tracking-[0.4em] text-xs mb-4 font-semibold uppercase">
          Error 404
        </p>
        <h1 className="font-serif text-5xl font-normal text-white mb-4 leading-tight">
          Page Not Found
        </h1>
        <div className="h-[1px] w-16 bg-gold/40 mx-auto mb-6" />
        <p className="text-muted-foreground text-base mb-10 leading-relaxed font-sans">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Let&apos;s get you back to the collection.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-gold text-background px-10 py-3.5 text-xs font-bold tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
          >
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="border border-gold/50 text-gold px-10 py-3.5 text-xs font-bold tracking-[0.2em] uppercase hover:bg-gold hover:text-background transition-all duration-300"
          >
            Shop Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
