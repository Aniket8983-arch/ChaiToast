import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import Card from '../ui/Card'

interface Props {
  bioCount: number
  nonbioCount: number
  isLoading?: boolean
}

export default function CategoryDistributionChart({ bioCount, nonbioCount, isLoading }: Props) {
  const total = bioCount + nonbioCount
  const data = [
    { name: 'Biodegradable (BIO)', value: bioCount, color: '#22c55e' },
    { name: 'Non-Biodegradable (NONBIO)', value: nonbioCount, color: '#f59e0b' },
  ]

  if (isLoading) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading distribution...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-80 flex flex-col">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Waste Category Breakdown</h3>
        <p className="text-xs text-slate-400">Ratio of Biodegradable vs Non-Biodegradable scans</p>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center statistic */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="text-xl font-extrabold text-white">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Scans</span>
        </div>
      </div>
    </Card>
  )
}
