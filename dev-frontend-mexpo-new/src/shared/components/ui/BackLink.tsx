"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/utils/cn";

interface BackLinkProps {
  href?: string;
  label?: string;
  /** Path prefixes where the link is hidden entirely (e.g. ["/events"]). */
  hideOnRoutes?: string[];
  /** "default" (dashboard pill) or "hero" (auth template footer link). */
  variant?: "default" | "hero";
  className?: string;
}

/**
 * Unified back link — replaces both the old `BackToHomepage` (hero variant)
 * and the dashboard `BackLink`. Indonesian labels by default.
 */
export default function BackLink({
  href = "/",
  label = "Kembali",
  hideOnRoutes,
  variant = "default",
  className,
}: BackLinkProps) {
  const pathname = usePathname();
  if (hideOnRoutes?.some((route) => pathname.startsWith(route))) {
    return null;
  }

  if (variant === "hero") {
    return (
      <span
        className={cn(
          "bg-secondary xl:bg-transparent p-10 xl:p-5 rounded-none rounded-b-xl w-full",
          className,
        )}
      >
        <Link
          href={href}
          className="flex items-center text-white xl:hover:text-gray-700 xl:text-gray-500 hover:text-gray-100 dark:hover:text-gray-300 dark:text-gray-400 text-sm sm:text-base md:text-lg transition-colors"
        >
          <ArrowLeft className="mr-1.5 sm:mr-2 w-5 sm:w-6 h-5 sm:h-6" />
          {label}
        </Link>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}