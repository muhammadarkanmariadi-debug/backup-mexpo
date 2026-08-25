import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import { GeometricBannerBg } from "./GeometricBanner";

interface HeroBannerProps {
  /** Banner image path (defaults to the shared events banner). */
  image?: string;
  imageAlt?: string;
  imageClassName?: string;
  /** Overlay content (title, CTAs, badges…) rendered over the image. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared hero banner (image + centered overlay), previously duplicated inline
 * in `EventHero` (event role views) and the dashboard `Eventlist` hero.
 */
export function HeroBanner({
  image = "/images/cards/card-e.png",
  imageAlt = "Banner Event",
  imageClassName,
  children,
  className,
}: HeroBannerProps) {
  const isDefaultCardE = image === "/images/cards/card-e.png";

  return (
    <motion.div
      className={cn("relative mb-12 mt-0 lg:mt-10 overflow-hidden rounded-2xl", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isDefaultCardE ? (
        <GeometricBannerBg className={cn("rounded-2xl", imageClassName)} />
      ) : (
        <Image
          src={image}
          alt={imageAlt}
          width={1800}
          height={1000}
          loading="eager"
          className={cn(
            "h-100 w-full rounded-2xl object-cover md:h-80",
            imageClassName,
          )}
        />
      )}
      <div className={cn(
        "relative z-10 flex flex-col items-center justify-center gap-5 px-4 text-center text-white",
        isDefaultCardE ? "min-h-[280px] md:min-h-[320px] py-12" : "absolute inset-0"
      )}>
        {children}
      </div>
    </motion.div>
  );
}

export default HeroBanner;