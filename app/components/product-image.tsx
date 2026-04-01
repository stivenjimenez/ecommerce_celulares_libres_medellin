"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src"> & {
  src: string;
  fallbackSrc?: string;
  fallbackText?: string;
  fallbackClassName?: string;
};

export function ProductImage({
  src,
  fallbackSrc = "https://res.cloudinary.com/dwqyypb8q/image/upload/v1771952540/clm-logo_fyqsex.png",
  fallbackText = "Imagen no disponible",
  fallbackClassName,
  alt,
  ...props
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showFallbackText, setShowFallbackText] = useState(false);

  function handleError() {
    if (!usedFallback && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setUsedFallback(true);
      return;
    }

    setShowFallbackText(true);
  }

  if (showFallbackText) {
    return <div className={fallbackClassName}>{fallbackText}</div>;
  }

  return <Image {...props} src={currentSrc} alt={alt} onError={handleError} />;
}
