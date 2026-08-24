'use client'

import React from 'react'
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
  category: Category;
  search: string;
  events: Event[];
  isLoading: boolean;
  serverPagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (size: number) => void;
  };
}

const SECTION_META = {
  'Upcoming': {
    label: 'Event Akan Datang',
    title: 'Siapkan Diri untuk Apa yang Akan Datang!',
    emptyMessage: 'Belum ada event yang akan datang.',
  },
  'On Going': {
    label: 'Event Berlangsung',
    title: 'Jangan Sampai Terlewat!',
    emptyMessage: 'Tidak ada event yang sedang berlangsung.',
  },
  'Past': {
    label: 'Event Selesai',
    title: 'Kenang Kembali Momen-Momen Berkesan!',
    emptyMessage: 'Tidak ada event yang sudah selesai.',
  },
} as const;

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.6 },
};

const EventsLayout = ({
  category,
  search,
  events,
  isLoading,
  serverPagination,
}: EventsLayoutProps) => {
  const grouped = useGroupedEvents(events, search);

  const isEmpty =
    category === 'All Events'
      ? Object.values(grouped).every((arr) => arr.length === 0)
      : events.length === 0;

  if (isLoading) return <LoadingSpinner />;

  if (isEmpty) {
    return (
      <div className='mx-5 py-12'>
        <ContentTitle1
          title='Tidak Ada '
          spanText='Event'
          description='Maaf, kami tidak menemukan event yang sesuai dengan filter atau pencarian Anda.'
        />
      </div>
    );
  }

  return (
    <div>
      {category === 'All Events' ? (
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
        <div className="px-4 sm:px-6 md:px-8">
          <ContentTitle2
            category={SECTION_META[category].label}
            title={SECTION_META[category].title}
          />
          <div className="mt-6">
            <EventsGrid
              events={events}
              serverPagination={serverPagination}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsLayout;
