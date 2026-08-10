import { Event } from "@/entities/event/event.entity";

// ============================================================
// Helpers
// ============================================================

function toCalendarDate(dateStr: string): string {
  return new Date(dateStr)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function sanitize(str: string): string {
  return str?.replace(/[,;\\]/g, ' ').replace(/\n/g, '\\n') ?? ''
}

// ============================================================
// Add to Calendar
// ============================================================

export function getGoogleCalendarUrl(event: Event): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toCalendarDate(event.start_date)}/${toCalendarDate(event.end_date)}`,
    details: event.description ?? '',
    location: event.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function getOutlookCalendarUrl(event: Event): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.name,
    startdt: new Date(event.start_date).toISOString(),
    enddt: new Date(event.end_date).toISOString(),
    body: event.description ?? '',
    location: event.location ?? '',
  })
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

export function downloadIcsFile(event: Event): void {
  const start = toCalendarDate(event.start_date)
  const end = toCalendarDate(event.end_date)
  const now = toCalendarDate(new Date().toISOString())

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mexpo//mexpo//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uuid}@mexpo`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${sanitize(event.name)}`,
    `DESCRIPTION:${sanitize(event.description ?? '')}`,
    `LOCATION:${sanitize(event.location ?? '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.name.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// Share
// ============================================================

export interface ShareOptions {
  url: string
  title: string
  description?: string
}

function buildShareOptions(event: Event, baseUrl?: string): ShareOptions {
  const url = baseUrl ?? (typeof window !== 'undefined' ? window.location.href : '')
  return {
    url,
    title: event.name,
    description: event.description ?? '',
  }
}

export async function shareNative(event: Event, baseUrl?: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false
  const opts = buildShareOptions(event, baseUrl)
  try {
    // Only pass title and url because large text fields (like event description) 
    // famously crash the Windows native share dialog.
    await navigator.share({ title: opts.title, url: opts.url })
    return true
  } catch (err: any) {
    // If the user manually cancels the native share, do not trigger fallback, just fail silently.
    if (err.name === 'AbortError') return true; 
    return false
  }
}

export function getWhatsAppShareUrl(event: Event, baseUrl?: string): string {
  const opts = buildShareOptions(event, baseUrl)
  const text = `${opts.title}\n${opts.url}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function getTwitterShareUrl(event: Event, baseUrl?: string): string {
  const opts = buildShareOptions(event, baseUrl)
  const text = `${opts.title}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(opts.url)}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}
