/** South African / Afrikaans formatting via Intl (af-ZA). */
const LOCALE = 'af-ZA'

/** 24-hour time, e.g. "14:05". */
export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** "30 Mei 2026". */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Relative-ish label for sidebar: time today, else short date. */
export function formatListStamp(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) return formatTime(date)

  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/** Decimal comma, space thousands, e.g. 1234.5 → "1 234,5". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE).format(value)
}
