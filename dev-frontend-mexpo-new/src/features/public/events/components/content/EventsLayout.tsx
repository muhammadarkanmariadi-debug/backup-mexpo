'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'






import { useGroupedEvents } from '../../Hooks/useGrouped'
// import EventsGrid from './EventsGrid'
import CarouselSection from './CarouselSection'
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner'
import ContentTitle1 from '@/shared/components/ui/ContentTitle1'
import ContentTitle2 from '@/shared/components/ui/ContentTitle2'
import { Event } from '@/entities/event/event.entity'
import EventsGrid from './EventsGrid'



type Category = 'All Events' | 'On Going' | 'Upcoming' | 'Past'

interface EventsLayoutProps {
  category: Category
  search: string
  events: Event[]
  isLoading: boolean
}

const SECTION_META = {
  'Upcoming': {
    label: 'Upcoming Events',
    title: "Get Ready for What's Next!",
    emptyMessage: 'No upcoming events found.',
  },
  'On Going': {
    label: 'Ongoing Events',
    title: "Don't Miss Out!",
    emptyMessage: 'No ongoing events available.',
  },
  'Past': {
    label: 'Past Events',
    title: 'Relive the Moments That Matter!',
    emptyMessage: 'No past events available.',
  },
} as const

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.6 },
}

const EventsLayout = ({ category, search, events, isLoading }: EventsLayoutProps) => {

  const grouped = useGroupedEvents(events, search);

  const isEmpty =
    category === 'All Events'
      ? Object.values(grouped).every((arr) => arr.length === 0)
      : grouped[category]?.length === 0

  if (isLoading) return <LoadingSpinner />

  if (isEmpty) {
    return (
      <div className='mx-5'>
        <ContentTitle1
          title='No Events '
          spanText='Found'
          description="Sorry, we couldn't find any events matching your criteria."
        />
      </div>
    )
  }

  return (
    <div>
  

      {category === 'All Events' ? (
        // AllEvents.tsx dihapus — render langsung di sini
        <div className='flex flex-col gap-20'>
          {(['Upcoming', 'On Going', 'Past'] as const).map((cat) =>
            grouped[cat].length > 0 ? (
              <motion.div key={cat} {...fadeUp}>
                <CarouselSection
                  events={grouped[cat].slice(0, 6)}
                  category={cat}
                  {...SECTION_META[cat]}
                />
              </motion.div>
            ) : null
          )}
        </div>
      ) : (
        <div>
          <ContentTitle2
            category={SECTION_META[category].label}
            title={SECTION_META[category].title}
          />
          <EventsGrid events={grouped[category]} />
        </div>
      )}
    </div>
  )
}

export default EventsLayout
