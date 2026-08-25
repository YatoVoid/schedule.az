import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://schedule.az";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await prisma.store.findMany({ select: { slug: true, updatedAt: true } });

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...stores.map((store) => ({
      url: `${SITE_URL}/${store.slug}`,
      lastModified: store.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
