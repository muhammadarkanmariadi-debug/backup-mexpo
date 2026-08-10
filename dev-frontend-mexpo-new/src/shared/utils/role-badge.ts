// src/shared/utils/role-badge.ts
// Single source of truth for role badge colors across the app.
//
// Palette:
//   OWNER      → solid brand secondary (distinct on banner images)
//   COMMITTEE  → light blue tint
//   TENANT     → teal tint
//   VISITOR    → neutral gray
//   SUPERADMIN → purple tint

export const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-secondary text-white",
  COMMITTEE: "bg-blue-50 text-blue-700",
  TENANT: "bg-teal-50 text-teal-700",
  VISITOR: "bg-gray-100 text-gray-600",
  SUPERADMIN: "bg-purple-50 text-purple-700",
};

export function getRoleBadge(role?: string | null): string {
  if (!role) return ROLE_BADGE.VISITOR;
  return ROLE_BADGE[role.toUpperCase()] ?? ROLE_BADGE.VISITOR;
}