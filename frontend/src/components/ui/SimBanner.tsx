import { Cpu, Zap } from 'lucide-react'

interface Props {
  active?: boolean
  className?: string
}

export default function SimBanner({ active = true, className }: Props) {
  if (!active) return null
  return (
    <div className={`sim-banner ${className ?? ''}`}>
      <Cpu className="w-3.5 h-3.5" />
      <span>SIMULATED DATA</span>
      <span className="ml-1 text-slate-500">— No physical sensors connected</span>
    </div>
  )
}
