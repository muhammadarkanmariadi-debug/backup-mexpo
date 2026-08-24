// src/features/events/components/EventsGrid.tsx
// Grid event dengan pagination menggunakan komponen dan hook yang reusable.

'use client'

import { Event } from '@/entities/event/event.entity'
import VerticalEventCard from '@/shared/components/cards/VerticalEventCard'
import { DataPagination } from '@/shared/components/ui/DataPagination'
import { usePagination } from '@/shared/hooks/usePagination'
// sesuaikan dengan path komponen Card kamu

interface ServerPaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
}

interface EventsGridProps {
  events: Event[];
  serverPagination?: ServerPaginationConfig;
}

const EventsGrid = ({ events, serverPagination }: EventsGridProps) => {
  const clientPagination = usePagination<Event>({
    totalItems: events.length,
    initialPageSize: 12,
  });

  const isServer = Boolean(serverPagination);
  const currentItems = isServer ? events : clientPagination.paginate(events);
  const currentPage = isServer
    ? serverPagination!.currentPage
    : clientPagination.currentPage;
  const totalPages = isServer
    ? serverPagination!.totalPages
    : clientPagination.totalPages;
  const totalItems = isServer
    ? serverPagination!.totalItems
    : events.length;
  const itemsPerPage = isServer
    ? serverPagination!.itemsPerPage ?? 12
    : clientPagination.itemsPerPage;
  const onPageChange = isServer
    ? serverPagination!.onPageChange
    : clientPagination.setPage;
  const onItemsPerPageChange = isServer
    ? (serverPagination!.onItemsPerPageChange ?? (() => {}))
    : clientPagination.setItemsPerPage;

  if (events.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Tidak ada event ditemukan.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((ev) => (
          <VerticalEventCard key={ev.uuid} event={ev} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default EventsGrid;