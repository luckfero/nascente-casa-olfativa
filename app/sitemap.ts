import type { MetadataRoute } from "next";
import { collections, products } from "@/lib/catalog";

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  if (!publicSiteUrl) return [];

  const staticRoutes = [
    "",
    "/produtos",
    "/colecoes",
    "/guia-olfativo",
    "/sobre",
    "/ajuda",
    "/contato",
    "/politicas",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${publicSiteUrl}${route}`,
      lastModified: new Date("2026-07-26"),
    })),
    ...products.map((product) => ({
      url: `${publicSiteUrl}/produtos/${product.slug}`,
      lastModified: new Date("2026-07-26"),
    })),
    ...collections.map((collection) => ({
      url: `${publicSiteUrl}/colecoes/${collection.slug}`,
      lastModified: new Date("2026-07-26"),
    })),
  ];
}
