import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

type PageShellMaxWidth = "7xl" | "6xl" | "5xl" | "3xl";

const maxWidths: Record<PageShellMaxWidth, string> = {
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "3xl": "max-w-3xl",
};

interface PageShellProps {
  children: ReactNode;
  maxWidth?: PageShellMaxWidth;
  /**
   * Extra classes — used for vertical padding (e.g. `py-8`, `py-10`), centered
   * content, etc. Horizontal padding + max-width are baked in.
   */
  className?: string;
}

/**
 * Shared page container — `mx-auto max-w-* px-4` wrapper that removes the
 * repeated shell divs across dashboard/public pages. Pass vertical padding
 * through `className` so it never conflicts.
 */
export default function PageShell({ children, maxWidth = "7xl", className }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full px-4", maxWidths[maxWidth], className)}>
      {children}
    </div>
  );
}