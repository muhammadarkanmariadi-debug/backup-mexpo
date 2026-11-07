'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, ArrowRight, Building } from 'lucide-react'
import { getEventCategory, validateEventRegistration } from '@/shared/utils/validateEventCategory'
import { Event } from '@/entities/event/event.entity'
import { dateFormat } from '@/shared/utils/format'
import Button from '@/shared/components/button/Button'
import EventPhoto from '@/shared/components/ui/EventPhoto'
import { renderHighlightedTitle } from '../../utils/title-highlight.utils'
import { AddToCalendarButton } from '../button/AddToCalendarButton'
import { EVENT_TYPE_LABELS, labelFor } from '@/shared/data/labels'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const Hero = ({ eventData }: { eventData: Event }) => {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const regStatus = validateEventRegistration(
    eventData.registration_start || null,
    eventData.registration_deadline
  )

  const eventTypeLabel = labelFor(
    EVENT_TYPE_LABELS,
    eventData.event_type,
    'Event'
  )

  return (
    <section className='relative w-full overflow-hidden bg-white pt-6 pb-12 lg:pt-10 lg:pb-16'>
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.025]'
        style={{
          backgroundImage:
            'linear-gradient(var(--color-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--color-secondary) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8'>

          {/* ── Left Column: Value Proposition & CTAs ── */}
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='show'
            className='lg:col-span-7 flex flex-col justify-center space-y-5 lg:pr-6'
          >
            {/* Category Eyebrow Pill */}
            <motion.div>
              <span className='inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-jakarta text-xs font-bold tracking-wide text-secondary'>
                {eventTypeLabel}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div className="space-y-1">
              <h1
                className='font-public-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-[1.15] tracking-tight'
              >
                {renderHighlightedTitle(eventData?.name ?? '')}
              </h1>
              {eventData.organizer_name && (
                <p className="text-gray-500 font-semibold text-sm sm:text-base flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-secondary shrink-0" />
                  <span>Diselenggarakan oleh {eventData.organizer_name}</span>
                </p>
              )}
            </motion.div>

            {/* Description */}
            <motion.p
              className='max-w-2xl font-jakarta text-sm leading-relaxed text-gray-600 sm:text-base'
            >
              {eventData?.description}
            </motion.p>

            {/* Meta Information Pills */}
            <motion.div className='flex flex-col gap-2.5 sm:flex-row sm:flex-wrap pt-1'>
              <div className='inline-flex items-center gap-2 rounded-xl bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-secondary border border-blue-100 sm:text-sm'>
                <Calendar className='h-4 w-4 shrink-0 text-secondary' />
                <span>
                  {dateFormat(eventData?.start_date)}
                  {eventData?.end_date && eventData?.end_date !== eventData?.start_date
                    ? ` – ${dateFormat(eventData?.end_date)}`
                    : ''}
                </span>
              </div>
              {eventData.location && (
                <div className='inline-flex items-center gap-2 rounded-xl bg-blue-50/70 px-3.5 py-2 text-xs font-semibold text-secondary border border-blue-100 sm:text-sm'>
                  <MapPin className='h-4 w-4 shrink-0 text-secondary' />
                  <span className="truncate max-w-[260px]">
                    {eventData.location}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div className='flex flex-wrap items-center gap-3.5 pt-2'>
              <AddToCalendarButton
                event={eventData}
                className='!bg-white hover:!bg-gray-50 !text-gray-700 !border-gray-200 !px-5 !py-3 !rounded-xl !text-xs sm:!text-sm !font-semibold !shadow-sm'
              />

              {regStatus.canRegister && (
                <Button
                  onClick={() => {
                    setIsRedirecting(true)
                    router.push('/event/' + eventData.uuid + '/register')
                  }}
                  disabled={isRedirecting}
                  className='px-7 py-3 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all'
                  endIcon={<ArrowRight className='w-4 h-4' />}
                >
                  {isRedirecting ? 'Memuat...' : 'Daftar Event'}
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* ── Right Column: Event Poster Showcase Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className='lg:col-span-5 relative flex justify-center'
          >
            <div className='w-full max-w-[460px] rounded-3xl mt-10 overflow-hidden border border-blue-100 shadow-xl bg-white relative'>
         

              {/* Showcase Image from Real Event Photo */}
              <EventPhoto
                src={eventData.photo || '/images/cards/card-e.png'}
                alt={eventData.name}
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
              />

              {/* Floating Deadline Badge */}
              {eventData.registration_deadline && (
                <div className='p-4 bg-white/95 border-t border-gray-100 flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center shrink-0'>
                    <Clock className='w-5 h-5 text-secondary' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>
                      Pendaftaran ditutup pada
                    </p>
                    <p className='text-xs sm:text-sm font-bold text-gray-900 truncate'>
                      {dateFormat(eventData.registration_deadline)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

      </div>
      </div>
    </section>
  )
}

export default Hero
