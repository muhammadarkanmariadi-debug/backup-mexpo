'use client'

import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'

import { formatDateWithDay, formatTabDate, getDayName } from '@/shared/utils/format'
import { Workshop } from '@/entities/event/workshop.entity'
import { WorkshopCard } from '@/shared/components/cards/WorkshopCard'
import { DataPagination } from '@/shared/components/ui/DataPagination'
import TabListShell from './TabListShell'
import { registerWorkshop } from '@/services/workshop.service'

export const WorkshopTab = ({
  workshops,
  category = "Lokakarya",
  title = "Lokakarya & Sesi Praktik",
  onRefetchWorkshops,
  showRegisterButton = true,
}: {
  workshops: Workshop[]
  category?: string
  title?: string
  onRefetchWorkshops?: () => void
  /** Show the "Daftar Lokakarya" CTA (visitor dashboard uses true, public page uses false). */
  showRegisterButton?: boolean
}) => {
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [currentPage, setCurrentPage] = useState(1)
  const [submittingWorkshopId, setSubmittingWorkshopId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'time_asc' | 'time_desc' | 'title_asc' | 'title_desc' | 'quota_desc'>('time_asc')

  // Extract unique dates for day filter
  const availableDays = useMemo(() => {
    const set = new Set<string>()
    workshops.forEach(w => {
      if (w.start_time) set.add(w.start_time.split('T')[0])
    })
    return Array.from(set).sort()
  }, [workshops])

  // Filter & sort
  const filteredWorkshops = useMemo(() => {
    let result = [...workshops]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(w =>
        w.title.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.location && w.location.toLowerCase().includes(q))
      )
    }

    // Day filter
    if (selectedDay !== 'ALL') {
      result = result.filter(w => w.start_time && w.start_time.split('T')[0] === selectedDay)
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'time_asc') {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      }
      if (sortBy === 'time_desc') {
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'title_desc') {
        return b.title.localeCompare(a.title)
      }
      if (sortBy === 'quota_desc') {
        return (b.quota ?? 0) - (a.quota ?? 0)
      }
      return 0
    })

    return result
  }, [workshops, search, selectedDay, sortBy])

  // Pagination
  const totalItems = filteredWorkshops.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const pagedWorkshops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredWorkshops.slice(start, start + itemsPerPage)
  }, [filteredWorkshops, currentPage, itemsPerPage])

  // Group current page items by date for display
  const pagedGroupedByDate = useMemo(() => {
    const map: { [dateKey: string]: Workshop[] } = {}
    pagedWorkshops.forEach(w => {
      const key = w.start_time ? w.start_time.split('T')[0] : 'Lainnya'
      if (!map[key]) map[key] = []
      map[key].push(w)
    })
    return map
  }, [pagedWorkshops])

  const sortedDateKeys = useMemo(() => {
    return Object.keys(pagedGroupedByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )
  }, [pagedGroupedByDate])

  const handleRegisterWorkshop = async (workshopId: string) => {
    if (submittingWorkshopId) return

    setSubmittingWorkshopId(workshopId)
    try {
      const result = await registerWorkshop(workshopId)

      if (result.status) {
        toast.success(result.message || `Berhasil mendaftar lokakarya!`)
      } else {
        toast.error(
          result.message || 'Gagal mendaftar. Kuota mungkin sudah penuh.'
        )
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi ke server')
    } finally {
      setSubmittingWorkshopId(null)
      // Always refetch, not just on success: if the visitor was already
      // registered (other tab/device, double click) or the quota changed, the
      // list must reflect the server state instead of staying stale.
      onRefetchWorkshops?.()
    }
  }

  // Filter Pills Component
  const filterComponent = availableDays.length > 1 ? (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => { setSelectedDay('ALL'); setCurrentPage(1); }}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
          selectedDay === 'ALL'
            ? 'bg-secondary text-white shadow-xs'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Semua Hari ({workshops.length})
      </button>
      {availableDays.map((dayStr, idx) => (
        <button
          key={dayStr}
          type="button"
          onClick={() => { setSelectedDay(dayStr); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selectedDay === dayStr
              ? 'bg-secondary text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Hari {idx + 1} ({formatTabDate(dayStr)})
        </button>
      ))}
    </div>
  ) : null

  // Sort Dropdown Component
  const sortComponent = (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Urutkan:</span>
      <select
        value={sortBy}
        onChange={(e) => {
          setSortBy(e.target.value as any)
          setCurrentPage(1)
        }}
        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-secondary transition-colors"
      >
        <option value="time_asc">Waktu: Paling Awal</option>
        <option value="time_desc">Waktu: Paling Akhir</option>
        <option value="title_asc">Judul: A - Z</option>
        <option value="title_desc">Judul: Z - A</option>
        <option value="quota_desc">Kuota Terbanyak</option>
      </select>
    </div>
  )

  return (
    <TabListShell
      category={category}
      title={title}
      searchPlaceholder="Cari Lokakarya..."
      search={search}
      setSearch={(val) => { setSearch(val); setCurrentPage(1); }}
      filterComponent={filterComponent}
      sortComponent={sortComponent}
      totalCount={totalItems}
    >
      {sortedDateKeys.length > 0 ? (
        <div className="space-y-8">
          {sortedDateKeys.map(dateKey => (
            <div key={dateKey} className='space-y-3 sm:space-y-4 md:space-y-6'>
              <div className='flex sm:flex-row flex-col items-start sm:items-center gap-2 sm:gap-4'>
                <div className='flex items-center gap-2 sm:gap-3 bg-secondary shadow-sm px-3 sm:px-4 md:px-5 py-2 rounded-xl'>
                  <Calendar className='flex-shrink-0 w-4 sm:w-5 h-4 sm:h-5 text-white' />
                  <div className='text-left'>
                    <h3 className='font-bold text-white text-xs sm:text-sm md:text-base'>
                      {getDayName(dateKey)}
                    </h3>
                    <p className='text-[10px] text-blue-100 sm:text-xs'>
                      {formatDateWithDay(dateKey)}
                    </p>
                  </div>
                </div>
                <div className='hidden sm:block flex-1 border-blue-100 border-t' />
                <span className='bg-blue-50 border border-blue-100 px-2.5 sm:px-3 py-1 rounded-full font-semibold text-[10px] text-secondary sm:text-xs'>
                  {pagedGroupedByDate[dateKey].length} Lokakarya
                </span>
              </div>

              <div className='gap-4 sm:gap-6 grid grid-cols-1'>
                {pagedGroupedByDate[dateKey].map(workshop => (
                  <WorkshopCard
                    key={workshop.uuid}
                    workshop={workshop}
                    handleRefetchWorkshops={onRefetchWorkshops}
                    isSubmitting={submittingWorkshopId === workshop.uuid}
                    handleRegisterWorkshop={() => handleRegisterWorkshop(workshop.uuid)}
                    showRegisterButton={showRegisterButton}
                  />
                ))}
              </div>
            </div>
          ))}

          {totalItems > itemsPerPage && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[4, 6, 10, 20]}
            />
          )}
        </div>
      ) : (
        <div className="py-12 px-6 rounded-2xl border border-gray-100 bg-gray-50/50 text-center max-w-xl mx-auto">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">Tidak Ada Lokakarya Ditemukan</p>
          <p className="text-xs text-gray-400 mt-1">
            Coba ubah kata kunci pencarian atau ganti filter hari di atas.
          </p>
        </div>
      )}
    </TabListShell>
  )
}
