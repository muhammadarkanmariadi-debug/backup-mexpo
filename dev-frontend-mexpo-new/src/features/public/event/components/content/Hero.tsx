'use client'

import { faCalendar, faMapMarked } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Image from 'next/image'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getEventCategory, validateEventRegistration } from '@/shared/utils/validateEventCategory'
import { Event } from '@/entities/event/event.entity'
import { dateFormat } from '@/shared/utils/format'
import Button from '@/shared/components/button/Button'
import { renderHighlightedTitle } from '../../utils/title-highlight.utils'
import { AddToCalendarButton } from '../button/AddToCalendarButton'




// ─── animation ─────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}


// ─── component ─────────────────────────────────────────────

const Hero = ({ eventData }: { eventData: Event }) => {
  const eventCategory = getEventCategory(eventData.start_date, eventData.end_date)
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  const regStatus = validateEventRegistration(
    eventData.registration_start || null,
    eventData.registration_deadline
  )

  return (
    <section className='relative w-full overflow-hidden bg-white'>
      {/* subtle grid texture */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.025]'
        style={{
          backgroundImage:
            'linear-gradient(var(--color-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--color-secondary) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* right-side accent block (desktop only) */}
      <div
        aria-hidden
        className='hidden lg:block absolute right-0 top-0 h-full w-1/2 bg-blue-50/60'
        style={{ clipPath: 'polygon(6% 0, 100% 0, 100% 100%, 0% 100%)' }}
      />

      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid min-h-[calc(100svh-4rem)] grid-cols-1 items-center gap-8 py-16 sm:py-20 lg:grid-cols-2 lg:gap-0 lg:py-0'>

          {/* ── Left: copy ── */}
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='show'
            className='flex flex-col justify-center lg:pr-16 xl:pr-24'
          >
            {/* eyebrow */}
            <motion.div>
              <span className='inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-jakarta text-xs font-semibold tracking-wide text-secondary'>
                Pameran &amp; Seminar
              </span>
            </motion.div>

            {/* headline — adaptive clamp font + max 4 lines */}
            <motion.h1

              className='mt-4 font-public-sans font-extrabold leading-[1.1] tracking-tight line-clamp-4'
              style={{ fontSize: 'clamp(1.6rem, 4vw, 3.75rem)' }}
            >
              {renderHighlightedTitle(eventData?.name ?? '')}
            </motion.h1>

            {/* description */}
            <motion.p

              className='mt-4 max-w-[52ch] font-jakarta text-sm leading-relaxed text-gray-600 sm:text-base line-clamp-3'
            >
              {eventData?.description}
            </motion.p>

            {/* meta pills */}
            <motion.div className='mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap'>
              <span className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 font-jakarta text-xs font-semibold text-secondary ring-1 ring-blue-200 sm:text-sm'>
                <FontAwesomeIcon icon={faCalendar} className='h-3.5 w-3.5 shrink-0' />
                {dateFormat(eventData?.start_date)} – {dateFormat(eventData?.end_date)}
              </span>
              <span className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 font-jakarta text-xs font-semibold text-secondary ring-1 ring-blue-200 sm:text-sm'>
                <FontAwesomeIcon icon={faMapMarked} className='h-3.5 w-3.5 shrink-0' />
                {eventData?.location}
              </span>
            </motion.div>
            {eventCategory === 'Upcoming' && (
              <div className="mt-8">
                <AddToCalendarButton className='hover:text-secondary' event={eventData} />
              </div>
            )}
            {/* CTA */}
            {regStatus.canRegister && (
              <motion.div className='mt-8'>
                <Button
                  onClick={() => {
                    setIsRedirecting(true)
                    router.push('/event/' + eventData.uuid + '/register')
                  }}
                  disabled={isRedirecting}
                  className='px-8 py-3 text-sm sm:text-base hover:text-secondary hover:bg-white'
                >
                  {isRedirecting ? 'Memuat...' : 'Daftar Event'}
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* ── Right: image ── */}
          <motion.div

            initial='hidden'
            animate='show'
            className='relative w-full'
          >
            {/* decorative offset border */}
            <div
              aria-hidden
              className='absolute -bottom-3 -right-3 hidden h-full w-full rounded-tl-[2.5rem] rounded-br-[2.5rem] border-2 border-blue-200/60 lg:block'
            />

            <Image
              src={eventData.photo || '/images/cards/card-e.png'}
              alt={eventData?.name}
              width={900}
              height={600}
              priority
              className='relative w-full object-cover rounded-2xl
                h-56 xsm:h-64 sm:h-80 md:h-96
                lg:h-[32rem] xl:h-[36rem] 2xl:h-[40rem]
                lg:rounded-tl-[2.5rem] lg:rounded-br-[2.5rem]
                lg:rounded-tr-none lg:rounded-bl-none
              '
            />

            {/* floating deadline card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className='absolute -bottom-4 left-4 sm:left-6 flex items-center gap-3 rounded-xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md'
            >

              
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-secondary'>
                <FontAwesomeIcon icon={faCalendar} className='h-4 w-4' />
              </div>
              <div>
                <p className='font-jakarta text-[10px] font-medium uppercase tracking-widest text-gray-400'>
                  Registrasi ditutup
                </p>
                <p className='font-jakarta text-xs font-bold text-gray-900 sm:text-sm'>
                  {dateFormat(eventData?.registration_deadline)}
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

export default Hero