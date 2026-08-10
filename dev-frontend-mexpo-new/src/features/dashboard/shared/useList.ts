"use client";

import { useEffect, useState } from "react";

export interface ListResult<T> {
  data: T[];
  status: boolean;
  /** Backend pagination meta — reads `counts` for the total. */
  meta?: unknown;
}

/**
 * Server-backed list hook: manages page/quantity/search/sort query params +
 * pagination for a backend list endpoint. setState happens only after `await`
 * (avoids react-hooks/set-state-in-effect).
 */
export function useList<T>(
  fetcher: (query: Record<string, string>) => Promise<ListResult<T>>,
  deps: unknown[],
  initialPageSize = 10,
) {

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const query: Record<string, string> = {};
        // Strip empty-string filter values so they are not sent to the backend.
        for (const [k, v] of Object.entries(filters)) {
          if (v !== "") query[k] = v;
        }
        if (search) query.search = search;
        if (sortBy) {
          query.sort_by = sortBy;
          query.sort_dir = sortDir;
        }
        // Always send page + quantity so the backend always paginates.
        query.page = String(page);
        query.quantity = String(pageSize);
        const res = await fetcher(query);
        if (cancelled) return;
        setItems(res.data ?? []);
        setTotal(
          ((res.meta as { counts?: number } | undefined)?.counts) ??
            (res.data ?? []).length,
        );
      } catch {
        // keep previous items
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, page, pageSize, search, sortBy, sortDir, filters, version]);

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

  /** Re-run the current query after a mutation. */
  const refetch = () => setVersion((v) => v + 1);

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
    loading,
    refetch,
  };
}