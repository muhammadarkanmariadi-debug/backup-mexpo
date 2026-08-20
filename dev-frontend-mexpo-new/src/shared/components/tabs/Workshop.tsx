'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'

import { useGroupedWorkshop } from '../../../features/public/event/hooks/useGroupedWorkshop'
import { formatDateWithDay, getDayName } from '@/shared/utils/format'
import { Workshop } from '@/entities/event/workshop.entity'
import { WorkshopCard } from '@/shared/components/cards/WorkshopCard'
import { DataPagination } from '@/shared/components/ui/DataPagination'
import TabListShell from './TabListShell'
import { registerWorkshop } from '@/services/workshop.service'

export const WorkshopTab = ({
  workshops,
  onRefetchWorkshops,
  showRegisterButton = true,
}: {
  workshops: Workshop[]
  category?: string
  onRefetchWorkshops?: () => void
  /** Show the "Daftar Lokakarya" CTA (visitor dashboard uses true, public page uses false). */
  showRegisterButton?: boolean
}) => {
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [submittingWorkshopId, setSubmittingWorkshopId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredWorkshops = workshops.filter(workshop =>
    workshop.title.toLowerCase().includes(search.toLowerCase())
  )

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    currentDates,
    currentGroupedItems
  } = useGroupedWorkshop(filteredWorkshops, itemsPerPage)

  const handleRegisterWorkshop = async (workshopId: string) => {
    if (submittingWorkshopId) return;

    setSubmittingWorkshopId(workshopId);
    try {
      const result = await registerWorkshop(workshopId);

      if (result.status) {
        toast.success(result.message || `Berhasil mendaftar lokakarya!`);
        if (onRefetchWorkshops) onRefetchWorkshops();
      } else {
        toast.error(
          result.message || "Gagal mendaftar. Kuota mungkin sudah penuh.",
        );
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi ke server");
    } finally {
      setSubmittingWorkshopId(null);
    }
  };

  return (
    <TabListShell
      category="Lokakarya"
      title="Ikuti Lokakarya Kami"
      searchPlaceholder="Cari Lokakarya..."
      search={search}
      setSearch={setSearch}
    >
      {currentDates.length > 0 ? (
        <>
          {currentDates.map(dateKey => (
            <div key={dateKey} className='space-y-3 sm:space-y-4 md:space-y-6'>
              <div className='flex sm:flex-row flex-col items-start sm:items-center gap-2 sm:gap-4'>
                <div className='flex items-center gap-2 sm:gap-3 bg-secondary shadow-lg px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl'>
                  <Calendar className='flex-shrink-0 w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-white' />
                  <div className='text-left'>
                    <h3 className='font-bold text-white text-sm sm:text-base md:text-lg lg:text-xl'>
                      {getDayName(dateKey)}
                    </h3>
                    <p className='text-[10px] text-blue-100 sm:text-xs md:text-sm'>
                      {formatDateWithDay(dateKey)}
                    </p>
                  </div>
                </div>
                <div className='hidden sm:block flex-1 border-blue-200 border-t-2' />
                <span className='bg-blue-100 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full font-semibold text-[10px] text-secondary sm:text-xs md:text-sm'>
                  {currentGroupedItems[dateKey].length} Lokakarya
                </span>
              </div>

              <div className='gap-3 sm:gap-4 md:gap-6 grid grid-cols-1'>
                {currentGroupedItems[dateKey].map(workshop => (
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

          {filteredWorkshops.length > itemsPerPage && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredWorkshops.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50, 100]}
            />
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Tidak ada lokakarya ditemukan</div>
      )}
    </TabListShell>
  )
}
