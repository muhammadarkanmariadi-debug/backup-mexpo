'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Event } from '@/entities/event/event.entity'
import { setCookies } from '@/shared/utils/cookies'
import { getEventCategory, validateEventRegistration } from '@/shared/utils/validateEventCategory'
import { dateFormat } from '@/shared/utils/format'
import { getCtaLabel } from '@/shared/utils/getCtaLabel'

type HorizontalEventCardProps = {
  event: Event
  variant: 'primary' | 'secondary'
}

const btnBase =
  'px-6 sm:px-8 py-2 rounded-xl font-semibold text-sm sm:text-base whitespace-nowrap transition-all duration-300'
const btnDisabled = `${btnBase} bg-gray-100 text-gray-400 cursor-not-allowed opacity-80`

const HorizontalEventCard = ({ event, variant }: HorizontalEventCardProps) => {
  const router = useRouter()
  const eventCategory = getEventCategory(event.start_date, event.end_date)


  const registrationStatus = validateEventRegistration(
    event.registration_start ?? null,
    event.registration_deadline ?? null
  )

  
  const day = dateFormat(event.start_date).slice(0, 2)
  const monthYear = `${dateFormat(event.start_date).split(' ')[1]} ${dateFormat(event.start_date).split(' ')[2]}`

  const buttonLabel = getCtaLabel(eventCategory, registrationStatus.canRegister)
  const shouldSetCookie = registrationStatus.canRegister && eventCategory !== 'Past'
  const href = `/event/${event.slug ?? event.uuid}`

  const handleCardClick = () => router.push(href)

  const cardBase =
    'group flex xl:flex-row flex-col justify-between items-center gap-4 px-5 py-5 rounded-2xl transition-all duration-300 cursor-pointer'

  const primaryClass = `${cardBase} bg-white hover:bg-secondary shadow-sm hover:shadow-xl border border-gray-100 hover:border-secondary`
  const secondaryClass = `${cardBase} bg-secondary hover:bg-white shadow-sm hover:shadow-xl border border-secondary hover:border-gray-100`

  const isPrimary = variant === 'primary'

  const CTA = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const primaryBtn = `${btnBase} bg-secondary group-hover:bg-white text-white group-hover:text-secondary`
    const secondaryBtn = `${btnBase} bg-white group-hover:bg-secondary text-secondary group-hover:text-white`
    const cls = fullWidth ? 'flex justify-center w-full' : ''

    if (!registrationStatus.canRegister && eventCategory !== 'Past') {
      return (
        <span
          onClick={(e) => e.stopPropagation()}
          className={`${btnDisabled} ${cls}`}
        >
          Registrasi Ditutup
        </span>
      )
    }

    return buttonLabel ? (
      <Link
        href={href}
        onClick={(e) => {
          e.stopPropagation()
          if (shouldSetCookie) setCookies('event_uuid', event.uuid)
        }}
        className={`${isPrimary ? primaryBtn : secondaryBtn} ${cls}`}
      >
        {buttonLabel}
      </Link>
    ) : (
      <span className={`${btnDisabled} ${cls}`}>
        Coming Soon
      </span>
    )
  }

  return (
    <motion.div
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={isPrimary ? primaryClass : secondaryClass}
    >
      {/* Date Badge */}
      <div
        className={`flex flex-col flex-shrink-0 justify-center items-center px-5 py-4 rounded-xl min-w-[72px] transition-colors duration-300 ${
          isPrimary
            ? 'bg-secondary/8 group-hover:bg-white/10'
            : 'bg-white/10 group-hover:bg-secondary/8 max-w-[100px] text-center'
        }`}
      >
        <span
          className={`font-bold text-4xl md:text-5xl leading-none transition-colors duration-300 ${
            isPrimary
              ? 'text-secondary group-hover:text-white'
              : 'text-white group-hover:text-secondary'
          }`}
        >
          {day}
        </span>
        <span
          className={`mt-1 font-semibold text-xs tracking-wide transition-colors duration-300 ${
            isPrimary
              ? 'text-secondary group-hover:text-white/80'
              : 'text-white/80 group-hover:text-secondary/70'
          }`}
        >
          {monthYear}
        </span>
      </div>

      {/* Info */}
      <div className='flex flex-col flex-1 justify-center items-start sm:items-center gap-1.5 min-w-0 text-left sm:text-center'>
        <h3
          className={`font-semibold text-base sm:text-lg line-clamp-2 leading-snug transition-colors duration-300 ${
            isPrimary
              ? 'text-gray-900 group-hover:text-white'
              : 'text-white group-hover:text-gray-900'
          }`}
        >
          {event.name}
        </h3>
        <div
          className={`flex sm:flex-row flex-col items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm transition-colors duration-300 ${
            isPrimary
              ? 'text-gray-500 group-hover:text-white/75'
              : 'text-white/75 group-hover:text-gray-500'
          }`}
        >
          <div className='flex items-center gap-1.5'>
            <MapPin className='w-3.5 h-3.5 shrink-0' />
            <span className='line-clamp-1'>{event.location}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Calendar className='w-3.5 h-3.5 shrink-0' />
            <span>
              {dateFormat(event.start_date)} – {dateFormat(event.end_date)}
            </span>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className='sm:hidden mt-3 w-full'>
          <CTA fullWidth />
        </div>
      </div>

      {/* Desktop CTA */}
      <div className='hidden sm:flex flex-shrink-0'>
        <CTA />
      </div>
    </motion.div>
  )
}

export default HorizontalEventCard