// src/shared/hooks/usePagination.ts
// Hook untuk mengelola state pagination.
// Pisahkan logic dari UI agar bisa dipakai di komponen manapun.

'use client'

import { useState, useMemo, useEffect } from 'react'

interface UsePaginationOptions {
  /** Total item yang akan dipaginasi */
  totalItems: number
  /** Jumlah item per halaman awal (default: 10) */
  initialPageSize?: number
  /** Reset ke halaman 1 jika dependency berubah (misal: search, filter) */
  resetDeps?: unknown[]
}

interface UsePaginationReturn<T> {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  setPage: (page: number) => void
  setItemsPerPage: (size: number) => void
  /** Slice array berdasarkan halaman aktif */
  paginate: (items: T[]) => T[]
}

export function usePagination<T = unknown>({
  totalItems,
  initialPageSize = 10,
  resetDeps = [],
}: UsePaginationOptions): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPageState] = useState(initialPageSize)

  // Reset ke halaman 1 saat dependency (search/filter) berubah.
  const resetKey = JSON.stringify(resetDeps)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to page 1 when filters change
    setCurrentPage(1)
  }, [resetKey])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  )

  const setPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  const setItemsPerPage = (size: number) => {
    setItemsPerPageState(size)
    setCurrentPage(1) // selalu reset ke halaman 1
  }

  const paginate = (items: T[]): T[] => {
    const start = (currentPage - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    setPage,
    setItemsPerPage,
    paginate,
  }
}