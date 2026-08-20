"use client";

import { useEffect, useState } from "react";

/**
 * Loads an <img> element for Konva `Image`/background nodes.
 * Konva raster nodes need a real HTMLImageElement, not a URL. This hook
 * resolves a URL → HTMLImageElement and cleans up on unmount.
 *
 * Consumers MUST `key={src}` the component so a URL change remounts the hook
 * (state then resets automatically instead of needing a sync setState).
 */
export function useImage(src?: string): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => {
      if (!cancelled) setImg(el);
    };
    el.onerror = () => {
      if (!cancelled) setImg(undefined);
    };
    el.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return img;
}