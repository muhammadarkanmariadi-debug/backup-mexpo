import Image from "next/image";
import { cn } from "@/shared/utils/cn";

interface EventPhotoProps {
  src: string;
  alt: string;
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
 * The frame is always 16:9 so the page layout never shifts between events.
 * The image is shown whole (`object-contain`, nothing is cropped) and the
 * leftover space is filled with a blurred copy of the same image instead of
 * empty bars. A 16:9 image simply covers the backdrop completely.
 *
 * List cards keep using `object-cover` on purpose (uniform grid); this is
 * for places where the full poster should be readable, e.g. the detail page.
 */
export default function EventPhoto({
  src,
  alt,
  priority,
  sizes,
  unoptimized,
  className,
}: EventPhotoProps) {
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-gray-100", className)}>
      {/* Blurred backdrop — decorative, tiny low-quality variant. */}
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes="160px"
        quality={30}
        unoptimized={unoptimized}
        className="scale-125 object-cover opacity-90 blur-2xl"
      />
      {/* Full image, never cropped. */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized={unoptimized}
        className="object-contain"
      />
    </div>
  );
}
