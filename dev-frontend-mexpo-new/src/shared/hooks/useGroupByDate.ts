// src/shared/hooks/useGroupByDate.ts
"use client";

import { useMemo } from "react";

export interface DateGrouped<T> {
  /** Items grouped by day key (YYYY-MM-DD), each group sorted by start_time ascending. */
  grouped: Record<string, T[]>;
  /** Sorted day keys (YYYY-MM-DD). */
  days: string[];
}

/**
 * Generic hook that groups date-stamped items by day (`start_time` → `YYYY-MM-DD`),
 * sorts each day's items by start time, and returns the days in chronological order.
 *
 * Consolidates the duplicated logic previously in `useGroupedWorkshop` and
 * `useGroupedRundown`.
 */
export function useGroupByDate<T extends { start_time: string }>(
  items: T[] | undefined | null,
  keyOf: (item: T) => string = (item) => item.start_time.split("T")[0],
): DateGrouped<T> {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return { grouped: {}, days: [] };
    }

    const grouped: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyOf(item);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
    }

    const days = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    return { grouped, days };
  }, [items, keyOf]);
}