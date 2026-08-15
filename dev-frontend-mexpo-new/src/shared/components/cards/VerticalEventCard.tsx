'use client'

import { Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getEventCategory, validateEventRegistration } from '@/shared/utils/validateEventCategory'
import { dateFormat } from '@/shared/utils/format'
import { Event } from '@/entities/event/event.entity'
import { getCtaLabel } from '@/shared/utils/getCtaLabel'

const ctaClass = 'block bg-secondary group-hover:bg-white px-5 py-2.5 rounded-xl w-full font-semibold text-white group-hover:text-secondary text-sm text-center tracking-wide transition-all duration-300'




const VerticalEventCard = ({ event }: { event: Event }) => {
  const router = useRouter()
  const eventCategory = getEventCategory(event.start_date, event.end_date)
  const regStatus = validateEventRegistration(event.registration_start, event.registration_deadline)
  const ctaLabel = getCtaLabel(eventCategory, regStatus.canRegister)
  const href = `/event/${event.slug ?? event.uuid}`

  return (
    // ✅ motion.div — tidak ada nested <a>
    <motion.div
      onClick={() => router.push(href)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='group relative flex flex-col bg-white hover:bg-secondary shadow-sm hover:shadow-2xl border border-gray-100 hover:border-secondary rounded-2xl h-full overflow-hidden transition-all duration-300 cursor-pointer'
    >
      {/* Image */}
      <div className='relative w-full h-48 sm:h-52 overflow-hidden'>
        <Image
          src={event.photo || '/images/cards/card-e.png'}
          alt={event.name}
          fill
          className='object-cover group-hover:scale-105 transition-transform duration-500 ease-out'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
      </div>

      {/* Content */}
      <div className='flex flex-col flex-grow p-5'>
        <h3 className='mb-4 font-semibold text-gray-900 group-hover:text-white text-base sm:text-lg line-clamp-2 leading-snug transition-colors duration-300'>
          {event.name}
        </h3>

        <div className='flex flex-col gap-2 mb-5 text-sm'>
          <div className='flex items-start gap-2 text-gray-500 group-hover:text-white/80 transition-colors duration-300'>
            <MapPin className='mt-0.5 w-4 h-4 text-gray-400 group-hover:text-white/60 shrink-0' />
            <span className='line-clamp-1'>{event.location}</span>
          </div>
          <div className='flex items-center gap-2 text-gray-500 group-hover:text-white/80 transition-colors duration-300'>
            <Calendar className='w-4 h-4 text-gray-400 group-hover:text-white/60 shrink-0' />
            <span>{dateFormat(event.start_date)} – {dateFormat(event.end_date)}</span>
          </div>
        </div>

        {/* ✅ CTA — Link tidak nested dalam <a> lagi */}
        <div className='mt-auto'>
          {ctaLabel ? (
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()} // ✅ cegah double navigate
              className={ctaClass}
            >
              {ctaLabel}
            </Link>
          ) : (
            <button disabled className='bg-gray-100 px-5 py-2.5 rounded-xl w-full font-medium text-gray-400 text-sm cursor-not-allowed'>
              Segera Hadir
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default VerticalEventCard