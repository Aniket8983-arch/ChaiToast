import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  variant?: 'bio' | 'nonbio' | 'mixed' | 'online' | 'offline' | 'warning' | 'critical' | 'info' | 'simulated' | 'real' | 'default'
  size?: 'sm' | 'md'
}

const variants: Record<string, string> = {
  bio:       'bg-bio/20 text-bio border-bio/30',
  nonbio:    'bg-nonbio/20 text-nonbio border-nonbio/30',
  mixed:     'bg-mixed/20 text-mixed border-mixed/30',
  online:    'bg-brand-500/20 text-brand-400 border-brand-500/30',
  offline:   'bg-slate-700/50 text-slate-400 border-slate-600/30',
  warning:   'bg-warn/20 text-warn border-warn/30',
  critical:  'bg-danger/20 text-danger border-danger/30',
  info:      'bg-info/20 text-info border-info/30',
  simulated: 'bg-sim/20 text-sim border-sim/30',
  real:      'bg-brand-500/20 text-brand-400 border-brand-500/30',
  default:   'bg-slate-700/50 text-slate-300 border-slate-600/30',
}

export default function Badge({ children, variant = 'default', size = 'sm' }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
      variants[variant]
    )}>
      {children}
    </span>
  )
}
