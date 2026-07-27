import { MetadataRoute } from 'next';

const SITE_URL = 'https://viewora.in';
// INTERNAL_API_URL is used for server-side fetching inside the container network
// (e.g., http://viewora-server:5000/api/v1 on Azure/Docker).
// Falls back to NEXT_PUBLIC_API_URL, then localhost for local dev.
const API_BASE = process.env.INTERNAL_API_URL
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:5000/api/v1';

interface SlimProduct {
  slug: string;
  updatedAt: string;
}

async function fetchAllProductSlugs(): Promise<SlimProduct[]> {
  try {
    // Fetch a large batch of products for sitemap generation
    const res = await fetch(`${API_BASE}/products?limit=500&page=1`, {
      next: { revalidate: 3600 }, // revalidate every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []).map((p: SlimProduct) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchAllProductSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      changeFrequency: 'weekly',
      priority: 1,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/shop`,
      changeFrequency: 'daily',
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/collections/sunglasses`,
      changeFrequency: 'weekly',
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/collections/optical-frames`,
      changeFrequency: 'weekly',
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/collections/limited-edition`,
      changeFrequency: 'weekly',
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/socials`,
      changeFrequency: 'monthly',
      priority: 0.4,
      lastModified: new Date(),
    },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  }));

  return [...staticRoutes, ...productRoutes];
}
