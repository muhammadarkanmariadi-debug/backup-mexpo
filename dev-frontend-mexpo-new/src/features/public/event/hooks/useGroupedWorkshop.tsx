import { useMemo, useState } from "react"
import { Workshop } from "@/entities/event/workshop.entity"

export const useGroupedWorkshop = (workshops: Workshop[], itemsPerPage: number = 5) => {
  const [currentPage, setCurrentPage] = useState(1)

  const groupedWorkshops = useMemo(() => {
    const grouped: { [key: string]: Workshop[] } = {}

    workshops.forEach(workshop => {
      const dateKey = workshop.start_time.split('T')[0]

      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(workshop)
    })

    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        return (
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      })
    })

    return grouped
  }, [workshops])

  const sortedDates = useMemo(() => {
    return Object.keys(groupedWorkshops).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )
  }, [groupedWorkshops])

  const flattenedWorkshops = useMemo(() => {
    return sortedDates.flatMap(dateKey =>
      groupedWorkshops[dateKey].map(workshop => ({
        dateKey,
        workshop
      }))
    )
  }, [sortedDates, groupedWorkshops])

  const totalPages = Math.ceil(flattenedWorkshops.length / itemsPerPage)

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return flattenedWorkshops.slice(indexOfFirstItem, indexOfLastItem)
  }, [currentPage, itemsPerPage, flattenedWorkshops])

  const currentGroupedItems = useMemo(() => {
    const grouped: { [key: string]: Workshop[] } = {}
    currentItems.forEach(({ dateKey, workshop }) => {
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(workshop)
    })
    return grouped
  }, [currentItems])

  const currentDates = useMemo(() => {
    return Object.keys(currentGroupedItems).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )
  }, [currentGroupedItems])

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    currentDates,
    currentGroupedItems,
  }
}