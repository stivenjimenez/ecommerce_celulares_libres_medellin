import type { Metadata } from "next";

const publicStoreUrl = "https://www.celulareslibresmedellin.co";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? publicStoreUrl;

export function getPublicProductUrl(slug: string) {
  return new URL(
    `/productos/${encodeURIComponent(slug)}`,
    publicStoreUrl,
  ).toString();
}
export const siteTitle = "Celulares Libres Medellin";
export const siteName = "Celulares Libres Medellin";
export const siteDescription =
  "En celulares libres medellin encuentras celulares libres, ropa original y lo último en tecnología.";
export const defaultSocialImageUrl = new URL(
  "/og-whatsapp.png",
  siteUrl,
).toString();

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function getAbsoluteSiteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteUrl).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex,
}: PageMetadataInput): Metadata {
  const pageUrl = getAbsoluteSiteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "es_CO",
      url: pageUrl,
      siteName,
      title,
      description,
      images: [
        {
          url: defaultSocialImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultSocialImageUrl],
    },
  };
}
