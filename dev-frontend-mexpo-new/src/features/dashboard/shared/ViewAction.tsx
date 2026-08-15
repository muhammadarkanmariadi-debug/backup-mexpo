"use client";

import Link from "next/link";
import { cn } from "@/shared/utils/cn";

type ViewActionVariant = "primary" | "secondary" | "danger" | "success" | "warning";

/**
 * Shared action button used by all role views (owner/committee/tenant/visitor).
 * One visual language for every dashboard action:
 *   - primary   → blue tint, the main CTA (Daftar, Portal, Buka Kembali)
 *   - secondary → white/gray, regular actions (Edit, Verifikasi, Badge, …)
 *   - danger    → red tint, destructive (Hapus)
 *   - success   → green tint, affirmative (Ajukan Publikasi)
 *   - warning   → amber tint, "finishing" actions (Selesaikan Event)
 */
const VARIANTS: Record<ViewActionVariant, string> = {
  primary: "border-brand-200 text-secondary bg-brand-50 hover:bg-brand-100",
  secondary: "border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900",
  danger: "border-error-200 text-error-600 bg-white hover:bg-error-50",
  success: "border-success-200 text-success-700 bg-success-50 hover:bg-success-100",
  warning: "border-warning-200 text-warning-700 bg-warning-50 hover:bg-warning-100",
};

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

interface ViewActionProps {
  href?: string;
  onClick?: () => void;
  variant?: ViewActionVariant;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export default function ViewAction({
  href,
  onClick,
  variant = "secondary",
  disabled,
  type = "button",
  className,
  icon: Icon,
  children,
}: ViewActionProps) {
  const classes = cn(BASE, VARIANTS[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}