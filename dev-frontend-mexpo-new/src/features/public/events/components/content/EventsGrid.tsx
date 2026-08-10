// src/features/events/components/EventsGrid.tsx
// Grid event dengan pagination menggunakan komponen dan hook yang reusable.

'use client'

import { Event } from '@/entities/event/event.entity'
import VerticalEventCard from '@/shared/components/cards/VerticalEventCard'
import { DataPagination } from '@/shared/components/ui/DataPagination'
import { usePagination } from '@/shared/hooks/usePagination'
// sesuaikan dengan path komponen Card kamu

interface EventsGridProps {
  events: Event[]
}

const EventsGrid = ({ events }: EventsGridProps) => {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    setPage,
    setItemsPerPage,
    paginate,
  } = usePagination<Event>({
    totalItems: events.length,
    initialPageSize: 10,
  })

  const currentItems = paginate(events)

  if (events.length === 0) {
    return (
      <div className='flex justify-center items-center min-h-[300px]'>
        <p className='text-muted-foreground text-sm'>Tidak ada event ditemukan.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {currentItems.map((ev) => (
          <VerticalEventCard key={ev.uuid} event={ev} />
        ))}
      </div>

      {/* Pagination */}
      {events.length > 9 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={events.length}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  )
}

export default EventsGrid