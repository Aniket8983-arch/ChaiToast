import { cn, fillBarColor } from '../../lib/utils'

interface Props {
  value: number          // 0–100
  className?: string
  showLabel?: boolean
  animated?: boolean
}

export default function ProgressBar({ value, className, showLabel = false, animated = true }: Props) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="fill-bar-bg flex-1">
        <div
          className={cn('h-2 rounded-full transition-all duration-700', fillBarColor(clamped), animated && 'ease-out')}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-400 w-9 text-right">
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
