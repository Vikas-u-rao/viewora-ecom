export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCollection } from "@/lib/collections";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CollectionProductGrid from "@/components/CollectionProductGrid";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const col = getCollection(slug);
  if (!col) return {};

  return {
    title: `${col.title} — Viewora Collections`,
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

      <main className="flex-1 pt-28 pb-20">
        {/* Collection Hero Header */}
        <div className="bg-gradient-to-b from-card/80 to-background border-b border-border/60 py-12 px-6 text-center mb-10">
          <div className="max-w-[1400px] mx-auto">
            <p className="text-gold tracking-[0.3em] text-xs font-semibold uppercase mb-3">EXCLUSIVE COLLECTION</p>
            <h1 className="font-serif text-4xl sm:text-5xl text-white tracking-wide mb-3">{col.title}</h1>
            {col.tagline && (
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
                {col.tagline}
              </p>
            )}
            <div className="h-[2px] w-16 bg-gold mx-auto mt-6 rounded-full" />
          </div>
        </div>

        {/* Collection Grid Container */}
        <section className="px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/#collections"
                className="inline-flex items-center gap-2 text-xs tracking-[0.2em] font-semibold text-gold hover:text-gold-soft transition-colors uppercase"
              >
                &larr; ALL COLLECTIONS
              </Link>
            </div>

            <CollectionProductGrid collection={col.slug} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
