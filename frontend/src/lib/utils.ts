import type { BinStatus, AlertSeverity, ClassificationLabel, DataSource } from '../types'

/** Clamp a value between min and max */
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max)

/** Format a number as percentage string */
export const pct = (val: number, decimals = 1) =>
  `${val.toFixed(decimals)}%`

/** Format a datetime string to a short locale time */
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

/** Format a datetime string to a date + time */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

/** Human-readable relative time */
export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

/** Color for fill level bars and badges */
export const fillColor = (pct: number): string => {
  if (pct >= 95) return 'bg-danger text-white'
  if (pct >= 80) return 'bg-warn text-black'
  if (pct >= 60) return 'bg-yellow-500 text-black'
  return 'bg-brand-500 text-white'
}

/** Tailwind border color for fill bars */
export const fillBarColor = (pct: number): string => {
  if (pct >= 95) return 'bg-danger'
  if (pct >= 80) return 'bg-warn'
  if (pct >= 60) return 'bg-yellow-500'
  return 'bg-brand-500'
}

/** Category display colors */
export const categoryColor: Record<string, string> = {
  BIO:    'bg-bio/20 text-bio border border-bio/30',
  NONBIO: 'bg-nonbio/20 text-nonbio border border-nonbio/30',
  MIXED:  'bg-mixed/20 text-mixed border border-mixed/30',
}

/** Status dot color */
export const statusColor: Record<string, string> = {
  ONLINE:      'bg-brand-500',
  OFFLINE:     'bg-slate-500',
  FULL:        'bg-danger',
  MAINTENANCE: 'bg-warn',
  ERROR:       'bg-danger',
}

/** Alert severity colors */
export const severityColor: Record<AlertSeverity, string> = {
  INFO:     'text-info bg-info/10 border-info/20',
  WARNING:  'text-warn bg-warn/10 border-warn/20',
  CRITICAL: 'text-danger bg-danger/10 border-danger/20',
}

/** Label color for AI classification */
export const labelColor: Record<ClassificationLabel, string> = {
  BIO:    'bg-bio/20 text-bio border border-bio/30',
  NONBIO: 'bg-nonbio/20 text-nonbio border border-nonbio/30',
}

/** Is this reading simulated? */
export const isSimulated = (source: DataSource) => source === 'SIMULATED'

/** cn() utility — join class strings */
export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(' ')
