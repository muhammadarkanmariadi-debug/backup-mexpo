"use client";

import { getRoleBadge } from "@/shared/utils/role-badge";

interface Props {
  role?: string | null;
  /** Optional override label (default: title-cased role). */
  label?: string;
  className?: string;
}

/** Shared role pill — consistent color per role across the whole app. */
export default function RoleBadge({ role, label, className }: Props) {
  const text =
    label ??
    (role ? role.charAt(0) + role.slice(1).toLowerCase() : "—");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 ${getRoleBadge(role)} ${className ?? ""}`}
    >
      {text}
    </span>
  );
}