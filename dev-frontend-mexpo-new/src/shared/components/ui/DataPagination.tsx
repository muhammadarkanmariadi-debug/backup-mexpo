// src/shared/components/ui/DataPagination.tsx
// Komponen pagination reusable berbasis shadcn/ui.
// Bisa dipakai di mana saja: EventsGrid, RegistrationList, dll.
// Primitive pagination di-folding ke sini (sebelumnya di src/components/ui/pagination.tsx).

'use client'

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { cn } from "@/shared/utils/cn"

// ─── Pagination primitives (shadcn, self-contained) ──────────────────────────

const LINK_BASE =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const LINK_VARIANTS = {
  outline: "border-border bg-background hover:bg-muted hover:text-foreground",
  ghost: "hover:bg-muted hover:text-foreground",
} as const

const LINK_SIZES = {
  default: "h-8 gap-1.5 px-2.5",
  icon: "size-8",
} as const

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="paginasi"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & { size?: keyof typeof LINK_SIZES } & React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        LINK_BASE,
        isActive ? LINK_VARIANTS.outline : LINK_VARIANTS.ghost,
        LINK_SIZES[size],
        className,
      )}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  text = "Sebelumnya",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Ke halaman sebelumnya"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Berikutnya",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Ke halaman berikutnya"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">Halaman lainnya</span>
    </span>
  )
}

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
          <select
            value={String(itemsPerPage)}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className='h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900'
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={String(size)}>
                {size}
              </option>
            ))}
          </select>
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