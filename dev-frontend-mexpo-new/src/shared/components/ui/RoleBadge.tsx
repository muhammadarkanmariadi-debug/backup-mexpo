"use client";

import { getRoleBadge } from "@/shared/utils/role-badge";
import { labelFor, ROLE_LABELS } from "@/shared/data/labels";

interface Props {
  role?: string | null;
  /** Optional override label (default: Indonesian role label). */
  label?: string;
  className?: string;
}

/** Shared role pill — consistent color per role across the whole app. */
export default function RoleBadge({ role, label, className }: Props) {
  const text = label ?? labelFor(ROLE_LABELS, role, "—");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 ${getRoleBadge(role)} ${className ?? ""}`}
    >
      {text}
    </span>
  );
}