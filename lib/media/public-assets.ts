export const SITE_LOGO_KEY = "clm-logo_fyqsex.png";

export const CLOUDINARY_LOGO_URL =
  "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";

export function getR2PublicBaseUrl(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ?? "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.hostname === "res.cloudinary.com"
    ) {
      return null;
    }
    return url.href.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getSiteLogoUrl(): string {
  const base = getR2PublicBaseUrl();
  return base ? `${base}/${SITE_LOGO_KEY}` : CLOUDINARY_LOGO_URL;
}
