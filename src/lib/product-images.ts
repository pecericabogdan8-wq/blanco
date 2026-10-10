/** Strip cache-buster / query from stored paths. */
export function cleanImageSrc(src: string): string {
  const q = src.indexOf("?");
  return q === -1 ? src : src.slice(0, q);
}

/** Bust Next/Image disk cache when gallery files are replaced at the same path. */
export function versionedImageSrc(src: string, version: number | string): string {
  const base = cleanImageSrc(src);
  if (!base) return base;
  return `${base}?v=${version}`;
}

export function cleanImageList(images: string[]): string[] {
  return images.map(cleanImageSrc).filter(Boolean);
}
