import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import Card from '../ui/Card'
import type { Bin } from '../../types'

interface Props {
  bins: Bin[]
  isLoading?: boolean
}

export default function BinFillLevelChart({ bins, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading bin telemetry...</span>
        </div>
      </Card>
    )
  }

  const chartData = bins.map(b => ({
    name: b.id,
    label: b.label,
    fill: Math.round(b.current_fill_pct),
    status: b.status,
  }))

  const getBarColor = (pct: number) => {
    if (pct >= 90) return '#ef4444' // Critical
    if (pct >= 80) return '#f59e0b' // Warning
    if (pct >= 60) return '#eab308' // Medium
    return '#22c55e'                // Normal
  }

  return (
    <Card className="h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Smart Bin Fill Levels</h3>
          <p className="text-xs text-slate-400">Current fill percentage across registered IoT bins</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-800 text-slate-300">
          {bins.length} Monitored Bins
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(val: any) => [`${val}%`, 'Fill Level']}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
            />
            <Bar dataKey="fill" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.fill)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
