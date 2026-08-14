import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Card from '../ui/Card'

interface WasteTrendItem {
  date: string
  bio: number
  nonbio: number
  total: number
}

interface Props {
  data: WasteTrendItem[]
  isLoading?: boolean
}

export default function WasteGenerationChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading waste trend data...</span>
        </div>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-80 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-slate-400 font-semibold">No waste trend data available</p>
        <p className="text-xs text-slate-500 mt-1">Data will populate automatically as classifications accumulate.</p>
      </Card>
    )
  }

  return (
    <Card className="h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Waste Generation Trend</h3>
          <p className="text-xs text-slate-400">Daily classification counts by waste category</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-bio"><span className="w-2.5 h-2.5 rounded bg-bio" /> BIO</span>
          <span className="flex items-center gap-1.5 text-nonbio"><span className="w-2.5 h-2.5 rounded bg-nonbio" /> NONBIO</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="bio" name="Biodegradable" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
            <Bar dataKey="nonbio" name="Non-Biodegradable" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
