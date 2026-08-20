// src/shared/hooks/useList.ts
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

export interface ListResult<T> {
  data: T[];
  status: boolean;
  /** Backend pagination meta — reads `counts` for the total. */
  meta?: unknown;
}

/**
 * Server-backed list hook: manages page/quantity/search/sort query params +
 * pagination for a backend list endpoint, powered by TanStack Query.
 *
 * The public API is unchanged from the previous manual implementation so all
 * consumers keep working: items / total / totalPages / page / setPage /
 * pageSize / setPageSize / search / applySearch / sortBy / sortDir /
 * applySort / filters / applyFilter / loading / refetch.
 *
 * Internally the whole list (including every filter + page) is one query key,
 * so changing a filter or page triggers a fresh server fetch, and `refetch()`
 * invalidates every page of the list at once (after a mutation).
 */
export function useList<T>(
  fetcher: (query: Record<string, string>) => Promise<ListResult<T>>,
  deps: unknown[],
  initialPageSize = 10,
) {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Stable base key for this list instance (prefix of every page's key).
  const baseKey: QueryKey = ["useList", ...deps];

  const query = useQuery<ListResult<T>>({
    queryKey: [
      ...baseKey,
      { page, pageSize, search, sortBy, sortDir, filters },
    ],
    queryFn: async () => {
      const q: Record<string, string> = {};
      // Strip empty-string filter values so they are not sent to the backend.
      for (const [k, v] of Object.entries(filters)) {
        if (v !== "") q[k] = v;
      }
      if (search) q.search = search;
      if (sortBy) {
        q.sort_by = sortBy;
        q.sort_dir = sortDir;
      }
      // Always send page + quantity so the backend always paginates.
      q.page = String(page);
      q.quantity = String(pageSize);
      return fetcher(q);
    },
  });

  const items = query.data?.data ?? [];
  const total =
    ((query.data?.meta as { counts?: number } | undefined)?.counts) ??
    items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applySearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  /** Set/change the active sort field + direction (server-side). */
  const applySort = (field: string, dir: "asc" | "desc") => {
    setSortBy(field);
    setSortDir(dir);
    setPage(1);
  };

  const applyFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  /** Re-run the current query (all pages) after a mutation. */
  const refetch = () =>
    queryClient.invalidateQueries({ queryKey: baseKey });

  return {
    items,
    total,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    applySearch,
    sortBy,
    sortDir,
    applySort,
    filters,
    applyFilter,
    loading: query.isPending,
    /** True while a fetch is in flight, including refetches (search/page/mutation). */
    fetching: query.isFetching,
    refetch,
  };
}