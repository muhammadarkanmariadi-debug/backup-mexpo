// src/shared/hooks/useClientList.ts
"use client";

import { useMemo, useState } from "react";
import { usePagination } from "@/shared/hooks/usePagination";

/**
 * Client-side list helper for endpoints that return the full array with no
 * server search/pagination (e.g. ticket-types, registration fields, report tables).
 *
 * Combines search + optional sort + pagination; exposes a `useList`-like API
 * (search / applySearch / page / setPage / total / totalPages / sortBy /
 * sortDir / applySort) so callers don't re-implement filter/slice logic.
 *
 * Usage:
 *   const list = useClientList({
 *     items: rows,
 *     getSearch: (item) => `${item.name} ${item.uuid}`,
 *     getSortValue: (item, field) =>
 *       field === "visits" ? item.counts : item.name, // numeric vs string
 *   });
 *
 *   const visible = list.paged;   // sliced (filtered + sorted) current page
 *   <SortMenu ... sortBy={list.sortBy} sortDir={list.sortDir} onChange={list.applySort} />
 */
export function useClientList<T>({
  items,
  pageSize = 10,
  getSearch,
  getSortValue,
}: {
  items: T[];
  pageSize?: number;
  /** Function that returns the searchable string for one item. */
  getSearch?: (item: T) => string;
  /** Function returning the sortable value for one item given a sort field. */
  getSortValue?: (item: T, field: string) => string | number;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (q && getSearch) {
      list = items.filter((it) => getSearch(it).toLowerCase().includes(q));
    }
    if (sortBy && getSortValue) {
      const dir = sortDir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const va = getSortValue(a, sortBy);
        const vb = getSortValue(b, sortBy);
        if (typeof va === "number" && typeof vb === "number") {
          return va === vb ? 0 : va < vb ? -dir : dir;
        }
        const sa = String(va ?? "").toLowerCase();
        const sb = String(vb ?? "").toLowerCase();
        return sa === sb ? 0 : sa < sb ? -dir : dir;
      });
    }
    return list;
  }, [items, search, sortBy, sortDir, getSearch, getSortValue]);

  const pagination = usePagination<T>({
    totalItems: filtered.length,
    initialPageSize: pageSize,
    resetDeps: [search, sortBy, sortDir],
  });

  const paged = pagination.paginate(filtered);

  const applySearch = (value: string) => {
    setSearch(value);
    pagination.setPage(1);
  };

  const applySort = (field: string, dir: "asc" | "desc") => {
    setSortBy(field);
    setSortDir(dir);
    pagination.setPage(1);
  };

  return {
    search,
    applySearch,
    sortBy,
    sortDir,
    applySort,
    all: items,
    filtered,
    paged,
    page: pagination.currentPage,
    setPage: pagination.setPage,
    totalPages: pagination.totalPages,
    itemsPerPage: pagination.itemsPerPage,
    totalItems: pagination.totalItems,
    total: pagination.totalItems,
  };
}