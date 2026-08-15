import React from "react";
import { cn } from "@/shared/utils/cn";

interface PageHeaderProps {
  title: React.ReactNode;
  /** Secondary line under the title (e.g. event name). */
  subtitle?: React.ReactNode;
  /** Optional icon tile rendered to the left of the title. */
  icon?: { node: React.ReactNode; className?: string };
  /** Optional right-aligned action slot (buttons / filters). */
  action?: React.ReactNode;
  /** Centers the header block (used by badge/certificate "document" pages). */
  align?: "left" | "center";
  className?: string;
}

/**
 * Standardized page header used across dashboard pages.
 * Replaces the hand-rolled `<h1 className="text-2xl font-bold ...">` blocks
 * that previously varied in size (text-xl vs text-2xl) and structure.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  align = "left",
  className,
}: PageHeaderProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        centered && "flex-col",
        className,
      )}
    >
      <div className={cn("flex items-center gap-3", centered && "flex-col text-center")}>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600",
              icon.className,
            )}
          >
            {icon.node}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
export default PageHeader;