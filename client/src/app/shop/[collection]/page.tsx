import { notFound } from "next/navigation";
import { getCollection, collections } from "@/lib/collections";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CollectionProductGrid from "@/components/CollectionProductGrid";

interface PageProps {
  params: Promise<{ collection: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { collection } = await params;
  const col = getCollection(collection);
  if (!col) return {};

  return {
    title: `${col.title} — Viewora`,
    description: col.tagline,
    openGraph: {
      title: `${col.title} — Viewora`,
      description: col.tagline,
      images: [{ url: typeof col.hero === "string" ? col.hero : col.hero.src }],
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { collection } = await params;
  const col = getCollection(collection);

  if (!col) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="relative h-[55vh] min-h-[420px] flex items-center justify-center pt-20">
        <Image src={col.hero} alt={col.title} className="absolute inset-0 w-full h-full object-cover" width={1920} height={800} priority />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <p className="text-gold tracking-[0.35em] text-xs mb-5">COLLECTION</p>
          <h1 className="font-serif text-5xl lg:text-6xl font-normal leading-[1.05] mb-5 text-white">{col.title}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">{col.tagline}</p>
        </div>
      </section>

      <section className="py-20 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <p className="text-sm tracking-[0.2em] text-muted-foreground">
              {col.products.length} PIECES
            </p>
            <Link href="/#collections" className="text-xs tracking-[0.2em] text-gold border-b border-gold/50 hover:border-gold pb-0.5">
              ← ALL COLLECTIONS
            </Link>
          </div>
          <CollectionProductGrid collection={col.slug} />
        </div>
      </section>

      <section className="py-20 px-8 border-t border-border">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-gold tracking-[0.3em] text-xs mb-4 text-center">EXPLORE MORE</p>
          <h2 className="text-3xl lg:text-4xl font-normal text-center mb-10">Other Collections</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.filter((c) => c.slug !== col.slug).slice(0, 3).map((c) => (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className="group relative overflow-hidden aspect-[4/5] block"
              >
                <Image src={c.hero} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" width={800} height={900} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl text-gold mb-2">{c.title}</h3>
                  <span className="text-sm tracking-[0.2em] text-white">VIEW →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
