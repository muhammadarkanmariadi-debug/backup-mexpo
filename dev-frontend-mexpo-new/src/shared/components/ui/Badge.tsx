import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<BadgeTone, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-error-50 text-error-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-gray-100 text-gray-600",
};

const dotColors: Record<BadgeTone, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-error-500",
  info: "bg-blue-500",
  neutral: "bg-gray-500",
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Renders a small status dot before the label. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Shared status/label pill — one visual language for every status badge in the
 * app (event status, approval status, role, sponsor level, …).
 */
export default function Badge({ tone = "neutral", dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[tone])} />}
      {children}
    </span>
  );
}