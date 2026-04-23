// lib/formatDate.ts
// Smart date formatter — adapts label based on distance from now so
// "expires in 2 days" is never shown as just "3:45 PM".

/**
 * Format a date/time string in a human-readable way that always includes
 * enough context for the reader to know WHEN it is:
 *
 *   < 1 min ago   → "just now"
 *   same day      → "Today at 3:45 PM"
 *   yesterday     → "Yesterday at 3:45 PM"
 *   tomorrow      → "Tomorrow at 3:45 PM"
 *   within 6 days → "Wednesday at 3:45 PM"
 *   older/further → "Apr 25 at 3:45 PM"  (adds year if not current year)
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  // Midnight-aligned dates for day comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round(
    (dateStart.getTime() - todayStart.getTime()) / 86_400_000
  )

  if (diffDays === 0) return `Today at ${time}`
  if (diffDays === 1) return `Tomorrow at ${time}`
  if (diffDays === -1) return `Yesterday at ${time}`
  if (diffDays > 1 && diffDays <= 6) {
    const weekday = date.toLocaleDateString([], { weekday: 'long' })
    return `${weekday} at ${time}`
  }

  // Older or more than 6 days out — show full date
  const sameYear = date.getFullYear() === now.getFullYear()
  const dateLabel = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  return `${dateLabel} at ${time}`
}

/**
 * Compact relative time for table rows — "5m", "2h 10m", "3d".
 * For times in the future, prefixes with "in ".
 */
export function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const past = diffMs >= 0
  const abs = Math.abs(diffMs)

  const mins = Math.floor(abs / 60_000)
  const hours = Math.floor(abs / 3_600_000)
  const days = Math.floor(abs / 86_400_000)

  let label: string
  if (mins < 1) label = 'just now'
  else if (hours < 1) label = `${mins}m`
  else if (days < 1) label = `${hours}h ${mins % 60}m`
  else label = `${days}d`

  if (label === 'just now') return label
  return past ? label : `in ${label}`
}
