'use client'

import { useState, useRef, useEffect } from 'react'
import { Event } from '@/entities/event/event.entity'
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
} from '@/features/public/event/utils/event-actions.utils'
import { Calendar } from 'lucide-react'

interface AddToCalendarButtonProps {
  event: Event
  className?: string
}

type CalendarItem = {
  label: string
  icon: string
  action: () => void
}

export function AddToCalendarButton({ event, className }: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const items: CalendarItem[] = [
    {
      label: 'Google Calendar',
      icon: 'brand-google',
      action: () => {
        window.open(getGoogleCalendarUrl(event), '_blank')
        setOpen(false)
      },
    },
    {
      label: 'Outlook',
      icon: 'brand-windows',
      action: () => {
        window.open(getOutlookCalendarUrl(event), '_blank')
        setOpen(false)
      },
    },
    {
      label: 'Apple Calendar (.ics)',
      icon: 'brand-apple',
      action: () => {
        downloadIcsFile(event)
        setOpen(false)
      },
    },
    {
      label: 'Unduh .ics',
      icon: 'calendar-down',
      action: () => {
        downloadIcsFile(event)
        setOpen(false)
      },
    },
  ]

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 p-4 text-sm font-semibold text-white bg-secondary border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors shadow-sm ${className || ''}`}
        aria-label="Tambah ke kalender"
        aria-expanded={open}
      >
        <Calendar width={16} height={16} />
        Tambah ke kalender
      </button>

      {open && (
        <div
          role="menu"
          className="absolute  top-[calc(100%+8px)] z-50 min-w-[200px] p-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={item.action}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-secondary bg-transparent rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors text-left"
            >
              <i className={`ti ti-${item.icon} text-lg opacity-80`} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
