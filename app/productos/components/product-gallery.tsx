"use client";

import { useState } from "react";

import { ProductImage } from "@/app/components/product-image";

import detailStyles from "../product-detail.module.css";

type Props = {
  images: string[];
  alt: string;
};

const fallbackImage =
  "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png";

function normalizeImages(images: string[]) {
  const seen = new Set<string>();

  const list = images
    .map((image) => image.trim())
    .filter((image) => image.length > 0)
    .filter((image) => {
      if (seen.has(image)) return false;
      seen.add(image);
      return true;
    });

  return list.length > 0 ? list : [fallbackImage];
}

export function ProductGallery({ images, alt }: Props) {
  const galleryImages = normalizeImages(images);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = Math.min(selectedIndex, galleryImages.length - 1);
  const activeImage = galleryImages[activeIndex];
  const hasMultiple = galleryImages.length > 1;
  const previousIndex = activeIndex === 0 ? galleryImages.length - 1 : activeIndex - 1;
  const nextIndex = activeIndex === galleryImages.length - 1 ? 0 : activeIndex + 1;

  return (
    <div className={detailStyles.galleryLayout}>
      {hasMultiple && (
        <div className={detailStyles.thumbsColumn}>
          {galleryImages.map((image, index) => {
            const active = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`${detailStyles.thumbButton} ${active ? detailStyles.thumbActive : ""}`}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${galleryImages.length}`}
              >
                <ProductImage
                  src={image}
                  alt={`${alt} miniatura ${index + 1}`}
                  fill
                  sizes="84px"
                  className={detailStyles.thumbImage}
                  fallbackClassName={detailStyles.thumbFallback}
                />
              </button>
            );
          })}
        </div>
      )}

      <div className={detailStyles.imageWrap}>
        {hasMultiple && (
          <>
            <button
              type="button"
              className={`${detailStyles.navArrow} ${detailStyles.navArrowLeft}`}
              aria-label="Imagen anterior"
              onClick={() => setSelectedIndex(previousIndex)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${detailStyles.navArrow} ${detailStyles.navArrowRight}`}
              aria-label="Siguiente imagen"
              onClick={() => setSelectedIndex(nextIndex)}
            >
              ›
            </button>
          </>
        )}
        <ProductImage
          key={activeImage}
          src={activeImage}
          alt={alt}
          fill
          priority
          sizes="(max-width: 960px) 100vw, 50vw"
          className={detailStyles.image}
          fallbackClassName={detailStyles.imageFallback}
        />
      </div>
    </div>
  );
}
