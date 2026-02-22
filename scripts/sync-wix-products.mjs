#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URLS = [
  "https://www.celulareslibresmedellin.shop/productos",
  "https://www.celulareslibresmedellin.shop/tecnologia",
  "https://www.celulareslibresmedellin.shop/bmxmedellin",
];

const CATEGORY_BY_PAGE = {
  tecnologia: "technology",
  bmxmedellin: "bikes",
};

const SHOES_HINTS = [/tenis/i, /old skool/i, /slip on/i, /authentic/i, /shoe/i];
const CLOTHING_HINTS = [
  /gorra/i,
  /gorro/i,
  /camiseta/i,
  /buso/i,
  /hoodie/i,
  /jersey/i,
  /chompa/i,
  /calcetin/i,
  /medias/i,
];

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCandidateUrl(rawUrl) {
  if (!rawUrl) return null;
  const cleaned = decodeHtml(rawUrl.trim().replace(/^url\((.*)\)$/i, "$1")).replace(
    /^["']|["']$/g,
    "",
  );
  try {
    return new URL(cleaned).toString();
  } catch {
    return null;
  }
}

function scoreImageUrl(url) {
  try {
    const parsed = new URL(url);
    let score = 0;

    const widthFromQuery = Number.parseInt(parsed.searchParams.get("w") ?? "", 10);
    const widthFromPath = [...parsed.pathname.matchAll(/(?:^|[\/,_-])w[_-](\d{2,5})(?:[\/,_-]|$)/gi)]
      .map((match) => Number.parseInt(match[1], 10))
      .find((value) => Number.isFinite(value));

    const width = Math.max(widthFromQuery || 0, widthFromPath || 0);
    score += width;

    if (/q[_-]100/i.test(parsed.pathname) || parsed.searchParams.get("q") === "100") {
      score += 50;
    }

    if (/\.(png|jpg|jpeg|webp|avif)$/i.test(parsed.pathname)) {
      score += 10;
    }

    return score;
  } catch {
    return 0;
  }
}

function extractBestImageUrl(item) {
  const imgTag =
    [...item.matchAll(/<img[^>]*>/gi)].map((match) => match[0]).find((tag) =>
      /data-hook="gallery-item-image-img"/i.test(tag),
    ) ?? "";
  if (!imgTag) return null;

  const srcMatch = imgTag.match(/\ssrc="([^"]+)"/i);
  const srcsetMatch = imgTag.match(/\ssrcset="([^"]+)"/i);

  const candidates = [];
  const src = normalizeCandidateUrl(srcMatch?.[1] ?? "");
  if (src) candidates.push(src);

  if (srcsetMatch?.[1]) {
    const parsedSrcset = srcsetMatch[1]
      .split(",")
      .map((entry) => normalizeCandidateUrl(entry.trim().split(/\s+/)[0]))
      .filter(Boolean);
    candidates.push(...parsedSrcset);
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => scoreImageUrl(b) - scoreImageUrl(a));
  return candidates[0];
}

function parsePrice(value) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number.parseInt(digits, 10);
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function inferVariants(name, notes) {
  const joined = `${name} ${notes.join(" ")}`;
  const variants = {};

  const sizeMatches = joined.match(
    /(talla(?:s)?\s+[a-z0-9.\-"\s]+|us\s?[0-9.]+(?:\s?-\s?[0-9.]+)?|xs|s|m|l|xl|xxl)/gi,
  );

  if (sizeMatches?.length) {
    variants.size = [...new Set(sizeMatches.map((item) => item.trim()))];
  }

  const colorMatches = joined.match(
    /\b(black|white|brown|beige|yellow|grey|gray|red|blue|green|gum)\b/gi,
  );
  if (colorMatches?.length) {
    variants.color = [...new Set(colorMatches.map((item) => item.toLowerCase()))];
  }

  return Object.keys(variants).length ? variants : undefined;
}

function inferCondition(notes) {
  const raw = notes.join(" ").toLowerCase();
  if (raw.includes("exhibici")) return "display";
  if (raw.includes("open box")) return "open_box";
  if (raw.includes("like new")) return "like_new";
  if (raw.includes("usado")) return "used";
  if (raw.includes("nuevo")) return "new";
  if (raw.includes("preventa")) return "preorder";
  return undefined;
}

function inferCategoryFromText(pageSlug, title, details) {
  if (pageSlug in CATEGORY_BY_PAGE) {
    return CATEGORY_BY_PAGE[pageSlug];
  }

  const blob = `${title} ${details.join(" ")}`.toLowerCase();

  if (SHOES_HINTS.some((rule) => rule.test(blob))) {
    return "shoes";
  }

  if (CLOTHING_HINTS.some((rule) => rule.test(blob))) {
    return "clothing";
  }

  return "clothing";
}

function extractProductsFromHtml(html, pageSlug) {
  const products = [];
  const items = html
    .split(/<div data-id="[^"]+" class="item-link-wrapper"[^>]*>/g)
    .slice(1);

  for (const item of items) {
    const titleMatch = item.match(/data-hook="item-title"[\s\S]*?<span>([\s\S]*?)<\/span>/i);
    const title = titleMatch ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, " ")) : "";
    if (!title) continue;

    const imageUrl = extractBestImageUrl(item);

    const descriptionBlockMatch = item.match(
      /<div[^>]*data-hook="item-description"[^>]*>([\s\S]*?)<\/div>/i,
    );
    const descriptionBlock = descriptionBlockMatch ? descriptionBlockMatch[1] : "";
    const spans = [...descriptionBlock.matchAll(/<span>([\s\S]*?)<\/span>/gi)].map((match) =>
      decodeHtml(match[1].replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ")),
    );

    const priceLine = spans.find((line) => line.includes("$")) ?? "";
    const price = parsePrice(priceLine);
    if (!price) continue;

    const notes = spans.filter((line) => line && line !== priceLine);
    const variants = inferVariants(title, notes);
    const condition = inferCondition(notes);
    const category = inferCategoryFromText(pageSlug, title, notes);
    const slug = slugify(title);

    products.push({
      id: "pending",
      slug,
      name: title,
      description: notes.join(" ").trim() || `Imported from ${pageSlug}.`,
      price,
      images: imageUrl ? [imageUrl] : ["/file.svg"],
      category,
      featured: false,
      ...(variants ? { variants } : {}),
      attributes: {
        source_page: pageSlug,
        source_section: pageSlug,
        ...(condition ? { condition } : {}),
      },
    });
  }

  return products;
}

function extensionFromUrl(url) {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".png")) return ".png";
  if (path.endsWith(".webp")) return ".webp";
  if (path.endsWith(".avif")) return ".avif";
  return ".jpg";
}

function dedupeProducts(products) {
  const map = new Map();
  for (const product of products) {
    const key = `${product.category}:${product.slug}`;
    if (!map.has(key)) {
      map.set(key, product);
    }
  }
  return [...map.values()];
}

function assignShortIds(products) {
  return products.map((item, index) => ({
    ...item,
    id: `p_${String(index + 1).padStart(6, "0")}`,
  }));
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; CLM-SyncBot/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }

  return response.text();
}

async function downloadAndLocalizeImages(products, projectRoot) {
  const imagesDir = resolve(projectRoot, "public/products");
  await mkdir(imagesDir, { recursive: true });

  const downloaded = new Map();

  for (const product of products) {
    const remote = product.images?.[0];
    if (!remote || !remote.startsWith("http")) {
      product.images = ["/file.svg"];
      continue;
    }

    if (downloaded.has(remote)) {
      product.images = [downloaded.get(remote)];
      continue;
    }

    try {
      const extension = extensionFromUrl(remote);
      const filename = `${product.slug}${extension}`;
      const localPath = resolve(imagesDir, filename);
      const response = await fetch(remote, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; CLM-SyncBot/1.0)" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      await writeFile(localPath, bytes);

      const publicPath = `/products/${filename}`;
      downloaded.set(remote, publicPath);
      product.images = [publicPath];
    } catch {
      product.images = ["/file.svg"];
    }
  }
}

async function main() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const allProducts = [];

  for (const url of SOURCE_URLS) {
    const html = await fetchPage(url);
    const pageSlug = new URL(url).pathname.replace("/", "") || "home";
    const products = extractProductsFromHtml(html, pageSlug);
    allProducts.push(...products);
    console.log(`[sync] ${pageSlug}: ${products.length} items parsed`);
  }

  const normalized = assignShortIds(
    dedupeProducts(allProducts).sort((a, b) => a.name.localeCompare(b.name)),
  );
  await downloadAndLocalizeImages(normalized, projectRoot);

  const outputPath = resolve(projectRoot, "data/products.generated.json");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  console.log(
    `[sync] wrote ${normalized.length} products with localized images -> data/products.generated.json`,
  );
}

main().catch((error) => {
  console.error("[sync] failed", error);
  process.exit(1);
});
