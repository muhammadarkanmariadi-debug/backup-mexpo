import type { LucideIcon } from "lucide-react";

/**
 * Shared types for the About page (FIX-06).
 * `StatItem` is consumed by `content/StatCard.tsx`.
 */
export interface StatItem {
  id: number;
  value: number;
  suffix: string;
  title: string;
  icon: LucideIcon;
}
