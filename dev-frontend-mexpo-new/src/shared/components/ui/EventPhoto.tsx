import Image from "next/image";
import { cn } from "@/shared/utils/cn";
import {
  clampRatio,
  DEFAULT_PHOTO_FIT,
  DEFAULT_PHOTO_RATIO,
  type PhotoFit,
} from "@/shared/utils/photo-ratio";

interface EventPhotoProps {
  src: string;
  alt: string;
  /** Frame ratio (width / height). Defaults to 16:9. */
  ratio?: number;
  /**
   * `contain` (default): show the whole photo over a blurred copy of itself.
   * `cover`: fill the frame and crop whatever does not fit.
   */
  fit?: PhotoFit;
  /** Cap the frame height in px; the width shrinks to keep the ratio. */
  maxHeight?: number;
  /** Preload (use for the above-the-fold image only). */
  priority?: boolean;
  /** Responsive `sizes` hint for the foreground image. */
  sizes?: string;
  /** Skip the Next optimizer (needed for blob:/data: previews). */
  unoptimized?: boolean;
  className?: string;
}

/**
 * Event poster/thumbnail that works for ANY aspect ratio.
 *
 * The frame has a fixed ratio (chosen per event, 16:9 by default), so the page
 * layout never shifts. With `fit="contain"` the photo is shown whole and the
 * leftover space is filled with a blurred copy of the same image instead of
 * empty bars; with `fit="cover"` it fills the frame and is cropped. A photo
 * that already matches the ratio looks identical in both modes.
 *
 * List cards keep using `object-cover` on purpose (uniform grid); this is for
 * places where the poster should be shown the way the organizer chose.
 */
export default function EventPhoto({
  src,
  alt,
  ratio = DEFAULT_PHOTO_RATIO,
  fit = DEFAULT_PHOTO_FIT,
  maxHeight,
  priority,
  sizes,
  unoptimized,
  className,
}: EventPhotoProps) {
  const r = clampRatio(ratio);
  const isBlobOrData = src?.startsWith("blob:") || src?.startsWith("data:");
  const safeSrc = src && !isBlobOrData ? encodeURI(src) : src;
  const skipOptimization = unoptimized ?? isBlobOrData;

  return (
    <div
      className={cn("relative mx-auto overflow-hidden bg-gray-100", className)}
      style={{
        aspectRatio: String(r),
        width: maxHeight ? `min(100%, ${Math.round(maxHeight * r)}px)` : "100%",
      }}
    >
      {fit === "contain" && (
        // Blurred backdrop — decorative, tiny low-quality variant.
        <Image
          src={safeSrc}
          alt=""
          aria-hidden="true"
          fill
          sizes="160px"
          quality={30}
          unoptimized={skipOptimization}
          className="scale-125 object-cover opacity-90 blur-2xl"
        />
      )}
      <Image
        src={safeSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={skipOptimization}
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}
