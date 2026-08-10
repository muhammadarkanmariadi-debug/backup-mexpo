'use client'

import { useState, useRef, useEffect } from 'react'
import { Event } from '@/entities/event/event.entity'
import {
  shareNative,
  getWhatsAppShareUrl,
  getTwitterShareUrl,
  copyToClipboard,
} from '@/features/public/event/utils/event-actions.utils'

interface ShareButtonProps {
  event: Event
  baseUrl?: string
  className?: string
}

type ShareItem = {
  label: string
  icon: string
  action: () => void
}

export function ShareButton({ event, baseUrl, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const url = baseUrl ?? (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleShare() {
    const shared = await shareNative(event, url)
    if (!shared) setOpen((v) => !v)
  }

  async function handleCopy() {
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setOpen(false)
      }, 1500)
    }
  }

  const items: ShareItem[] = [
    {
      label: 'WhatsApp',
      icon: 'whatsapp',
      action: () => window.open(getWhatsAppShareUrl(event, url), '_blank'),
    },
    {
      label: 'X / Twitter',
      icon: 'brand-x',
      action: () => window.open(getTwitterShareUrl(event, url), '_blank'),
    },
    {
      label: copied ? 'Tersalin!' : 'Salin link',
      icon: copied ? 'check' : 'link',
      action: handleCopy,
    },
  ]

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors shadow-sm ${className || ''}`}
        aria-label="Bagikan event"
      >
        <i className="ti ti-share-2 text-lg" aria-hidden />
        Bagikan
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] p-2 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={item.action}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-700 bg-transparent rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors text-left"
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
