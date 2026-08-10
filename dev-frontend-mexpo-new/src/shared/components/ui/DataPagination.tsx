// src/shared/components/ui/DataPagination.tsx
// Komponen pagination reusable berbasis shadcn/ui.
// Bisa dipakai di mana saja: EventsGrid, RegistrationList, dll.

'use client'

import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"




// ─── Types ────────────────────────────────────────────────────────────────────

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

interface DataPaginationProps {
  /** Halaman aktif saat ini (1-indexed) */
  currentPage: number
  /** Total halaman */
  totalPages: number
  /** Jumlah item per halaman yang aktif */
  itemsPerPage: number
  /** Total semua item (untuk info "Showing X of Y") */
  totalItems: number
  /** Callback saat halaman berubah */
  onPageChange: (page: number) => void
  /** Callback saat jumlah item per halaman berubah */
  onItemsPerPageChange: (size: number) => void
  /** Opsi jumlah item per halaman (default: PAGE_SIZE_OPTIONS) */
  pageSizeOptions?: readonly number[]
}

// ─── Helper: build page number list dengan ellipsis ──────────────────────────

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')
  if (total > 1) pages.push(total)

  return pages
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DataPagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: DataPaginationProps) => {
  const indexOfFirst = (currentPage - 1) * itemsPerPage + 1
  const indexOfLast = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className='flex md:flex-row flex-col justify-between items-center gap-4 mt-8'>

      {/* ── Kiri: Info + items per page ── */}
      <div className='flex items-center gap-3'>
        <span className='text-muted-foreground text-sm'>
          Menampilkan{' '}
          <span className='font-medium text-foreground'>
            {totalItems === 0 ? 0 : indexOfFirst}–{indexOfLast}
          </span>{' '}
          dari{' '}
          <span className='font-medium text-foreground'>{totalItems}</span>{' '}
          data
        </span>

        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm whitespace-nowrap'>
            Tampilkan
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(val) => onItemsPerPageChange(Number(val))}
          >
            <SelectTrigger className='h-8 w-[70px] text-sm text-black'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Kanan: Pagination ── */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>

            {/* Previous */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                aria-disabled={currentPage === 1}
                className={
                  currentPage === 1
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

            {/* Page numbers */}
            {buildPageNumbers(currentPage, totalPages).map((item, i) =>
              item === '...' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={currentPage === item}
                    onClick={() => onPageChange(item as number)}
                    className='cursor-pointer'
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {/* Next */}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>

          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}