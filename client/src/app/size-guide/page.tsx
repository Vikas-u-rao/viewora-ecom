"use client";

import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-gold hover:text-gold-soft mb-8 uppercase">
          <ArrowLeft className="size-4" />
          <span>Back to Home</span>
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl text-white mb-2">Eyewear Size Guide</h1>
        <p className="text-xs text-muted-foreground mb-8">Find your perfect frame fit with Viewora dimensions.</p>

        <div className="space-y-8 font-sans">
          <section className="border border-border bg-card/60 p-6">
            <h2 className="font-serif text-xl text-white mb-4">Understanding Frame Measurements</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Every frame at Viewora features standard optical dimensions printed inside the frame temple (e.g., 52-18-140).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="border border-border p-4 bg-black/40">
                <span className="block text-2xl font-serif text-gold mb-1">52mm</span>
                <span className="text-xs font-medium text-white">Lens Width</span>
                <p className="text-[11px] text-muted-foreground mt-1">Horizontal width of one lens</p>
              </div>
              <div className="border border-border p-4 bg-black/40">
                <span className="block text-2xl font-serif text-gold mb-1">18mm</span>
                <span className="text-xs font-medium text-white">Bridge Width</span>
                <p className="text-[11px] text-muted-foreground mt-1">Distance between the two lenses</p>
              </div>
              <div className="border border-border p-4 bg-black/40">
                <span className="block text-2xl font-serif text-gold mb-1">140mm</span>
                <span className="text-xs font-medium text-white">Temple Length</span>
                <p className="text-[11px] text-muted-foreground mt-1">Full length of the arm piece</p>
              </div>
            </div>
          </section>

          <section className="border border-border bg-card/60 p-6">
            <h2 className="font-serif text-xl text-white mb-4">Viewora Standard Size Categories</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground border-collapse">
                <thead>
                  <tr className="border-b border-border text-white font-serif text-sm">
                    <th className="py-3 px-4">Size Category</th>
                    <th className="py-3 px-4">Face Width</th>
                    <th className="py-3 px-4">Lens Width</th>
                    <th className="py-3 px-4">Recommended For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Small (Narrow)</td>
                    <td className="py-3 px-4">&lt; 130 mm</td>
                    <td className="py-3 px-4">48 - 50 mm</td>
                    <td className="py-3 px-4">Narrow or petite face shapes</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Medium (Standard)</td>
                    <td className="py-3 px-4">130 - 138 mm</td>
                    <td className="py-3 px-4">51 - 53 mm</td>
                    <td className="py-3 px-4">Fits ~80% of adults comfortably</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white">Large (Wide)</td>
                    <td className="py-3 px-4">&gt; 139 mm</td>
                    <td className="py-3 px-4">54 - 58 mm</td>
                    <td className="py-3 px-4">Wider head shapes or oversized style</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className="border border-gold/40 bg-gold/5 p-6 flex items-start gap-4">
            <ShieldCheck className="size-6 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif text-base text-white mb-1">Unsure About Your Fit?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check the numbers printed inside your current comfortable pair of glasses or contact our personal stylists for custom recommendations.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
