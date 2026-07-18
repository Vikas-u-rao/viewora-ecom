export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCollection } from "@/lib/collections";
import Link from "next/link";
import Header from "@/components/header";
import CollectionProductGrid from "@/components/CollectionProductGrid";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const col = getCollection(slug);
  if (!col) return {};

  return {
    title: `${col.title} — Viewora`,
    description: col.tagline,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const col = getCollection(slug);

  if (!col) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />
      <main className="flex-1 pt-32">
        <div className="text-center mb-10 px-6">
          <p className="text-gold tracking-[0.3em] text-xs mb-3 font-medium">VIEWORA</p>
          <h1 className="font-serif text-4xl text-white">{col.title}</h1>
          {col.tagline && <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">{col.tagline}</p>}
          <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4"></div>
        </div>

        <section className="pb-20 px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-10">
              <p className="text-sm tracking-[0.2em] text-muted-foreground">
                {col.products.length} PIECE{col.products.length !== 1 ? "S" : ""}
              </p>
              <Link href="/#collections" className="text-xs tracking-[0.2em] text-gold border-b border-gold/50 hover:border-gold pb-0.5">
                ← ALL COLLECTIONS
              </Link>
            </div>
            <CollectionProductGrid collection={col.slug} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-8 text-center text-xs tracking-[0.2em] text-muted-foreground">
        © 2026 VIEWORA — FASHION EYEWEAR. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
}
