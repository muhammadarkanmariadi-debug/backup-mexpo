"use client";

import React from "react";
import { cn } from "@/shared/utils/cn";

interface GeometricBannerProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Geometric vector background that replicates the Mexpo `card-e.png` banner
 * using pure CSS & SVG — zero image download, crisp on all resolutions,
 * instant paint with zero layout shift.
 */
export function GeometricBannerBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none rounded-inherit bg-gradient-to-r from-[#3c85f3] via-[#357af0] to-[#2563eb] dark:from-[#2563eb] dark:via-[#1d4ed8] dark:to-[#1e40af]",
        className
      )}
    >
      {/* Decorative vector overlay matching card-e.png */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle glow gradients */}
          <radialGradient
            id="geo-glow-left"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(150 150) rotate(90) scale(250)"
          >
            <stop stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="geo-glow-right"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1050 250) rotate(90) scale(250)"
          >
            <stop stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient glows */}
        <circle cx="150" cy="150" r="250" fill="url(#geo-glow-left)" />
        <circle cx="1050" cy="250" r="250" fill="url(#geo-glow-right)" />

        {/* ── LEFT GEOMETRIC COMPOSITIONS ── */}
        {/* Top-left large diagonal triangle */}
        <path
          d="M0 0 L260 0 L0 260 Z"
          fill="white"
          fillOpacity="0.09"
        />

        {/* Top-left quarter circle arc */}
        <path
          d="M130 0 A130 130 0 0 1 260 130 L130 130 Z"
          fill="white"
          fillOpacity="0.13"
        />

        {/* Top-left arch / half circle */}
        <path
          d="M130 220 A90 90 0 0 1 310 220 Z"
          fill="white"
          fillOpacity="0.11"
        />

        {/* Bottom-left diagonal wedge */}
        <path
          d="M0 160 L180 340 L0 340 Z"
          fill="white"
          fillOpacity="0.08"
        />

        {/* Bottom-left pill capsule */}
        <rect
          x="180"
          y="270"
          width="90"
          height="38"
          rx="19"
          fill="white"
          fillOpacity="0.15"
        />

        {/* ── RIGHT GEOMETRIC COMPOSITIONS ── */}
        {/* Top-right horizontal pill */}
        <rect
          x="910"
          y="80"
          width="170"
          height="42"
          rx="21"
          fill="white"
          fillOpacity="0.14"
        />

        {/* Center-right floating circle */}
        <circle
          cx="820"
          cy="275"
          r="24"
          fill="white"
          fillOpacity="0.16"
        />

        {/* Bottom-right arch / half-circle */}
        <path
          d="M920 200 A120 120 0 0 0 1060 320 L1060 200 Z"
          fill="white"
          fillOpacity="0.12"
        />

        {/* Bottom-right fan / rounded wedge */}
        <path
          d="M920 320 A80 80 0 0 0 1080 320 Z"
          fill="white"
          fillOpacity="0.10"
        />

        {/* Far right diagonal triangle */}
        <path
          d="M1060 200 L1200 200 L1200 340 Z"
          fill="white"
          fillOpacity="0.09"
        />

        {/* Far right top triangle */}
        <path
          d="M1080 0 L1200 0 L1200 120 Z"
          fill="white"
          fillOpacity="0.07"
        />
      </svg>
    </div>
  );
}

/**
 * Full Hero Banner container with built-in Geometric Vector Background.
 */
export function GeometricBanner({
  className,
  children,
}: GeometricBannerProps) {
  return (
    <div
      className={cn(
        "relative mt-0 flex min-h-[320px] w-full flex-col items-center justify-center overflow-hidden rounded-xl px-4 py-12 sm:px-6 md:min-h-[400px] md:px-8 lg:mt-10 shadow-sm",
        className
      )}
    >
      <GeometricBannerBg />
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-4 text-center text-white sm:gap-3 md:gap-4">
        {children}
      </div>
    </div>
  );
}

export default GeometricBanner;
