import { redirect } from "next/navigation";

export default async function LegacyCollectionSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const mappedSlugs: Record<string, string> = {
    "sunglasses": "travel",
    "optical-frames": "executive-edit",
    "limited-edition": "quiet-luxury",
  };

  const targetSlug = mappedSlugs[slug] || slug;
  redirect(`/the-edit/${targetSlug}`);
}
