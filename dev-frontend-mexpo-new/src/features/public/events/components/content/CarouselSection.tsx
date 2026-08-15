'use client'

import { Event } from '@/entities/event/event.entity'
import { chunkArray } from '../../utils/chunkArray'
import ContentTitle2 from '@/shared/components/ui/ContentTitle2'
import HorizontalEventCard from '@/shared/components/cards/HorizontalEventCard'
import { useCarousel } from '../../Hooks/useCarousel'

type CarouselCategory = 'Upcoming' | 'On Going' | 'Past'

interface CarouselSectionProps {
  events: Event[]
  category: CarouselCategory
  title: string
  label: string
  variant?: 'primary' | 'secondary'
  emptyMessage?: string
}

const CarouselSection = ({
  events,
  title,
  label,
  variant = 'secondary',
  emptyMessage = 'Tidak ada event tersedia.',
}: CarouselSectionProps) => {
  const { currentSlide, nextSlide, prevSlide, goToSlide, emblaApi, emblaRef } =
    useCarousel({ data: events })

  const slides = chunkArray(events, 3)
  const hasMultipleSlides = slides.length > 1

  const handleMouseEnter = () => {
    if (hasMultipleSlides) emblaApi?.plugins()?.autoplay?.stop()
  }

  const handleMouseLeave = () => {
    if (hasMultipleSlides) emblaApi?.plugins()?.autoplay?.play()
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-white dark:bg-gray-900 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 transition-colors duration-300"
    >
      <ContentTitle2
        category={label}
        title={title}
        prevSlide={prevSlide}
        nextSlide={nextSlide}
        variant={variant}
      />

      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.length > 0 ? (
            slides.map((group, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {group.map((event) => (
                    <HorizontalEventCard
                      key={event.uuid}
                      event={event}
                      variant={variant}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 w-full text-center text-gray-400 dark:text-gray-500 text-sm">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {hasMultipleSlides && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Ke slide ${index + 1}`}
              className={`rounded-full transition-all duration-300 ${index === currentSlide
                ? 'w-5 h-2 bg-secondary'
                : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-secondary/50'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CarouselSection