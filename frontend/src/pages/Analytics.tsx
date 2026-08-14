import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, PieChart, TrendingUp, Download, Calendar, Filter,
  Trash2, ShieldCheck, CheckCircle2, Truck, RefreshCw, Clock, Activity, Zap
} from 'lucide-react'
import api from '../lib/api'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import WasteGenerationChart from '../components/charts/WasteGenerationChart'
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart'
import BinFillLevelChart from '../components/charts/BinFillLevelChart'
import { timeAgo, formatDateTime } from '../lib/utils'

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>('LAST_30_DAYS')

  // ── Automatic 3-second live database polling for analytics ────────────────
  const { data: summary, isLoading: loadingSummary, dataUpdatedAt, refetch } = useQuery<any>({
    queryKey: ['analytics', 'summary', timeRange],
    queryFn: () => api.get(`/analytics/summary?range=${timeRange}`).then(r => r.data),
    refetchInterval: 3000,
  })

  const { data: wasteTrend } = useQuery<any>({
    queryKey: ['analytics', 'waste-trend', timeRange],
    queryFn: () => api.get(`/analytics/waste-trend?range=${timeRange}`).then(r => r.data),
    refetchInterval: 3000,
  })

  const { data: categories } = useQuery<any>({
    queryKey: ['analytics', 'categories'],
    queryFn: () => api.get('/analytics/categories').then(r => r.data),
    refetchInterval: 3000,
  })

  const { data: binAnalytics = [] } = useQuery<any[]>({
    queryKey: ['analytics', 'bins'],
    queryFn: () => api.get('/analytics/bins').then(r => r.data),
    refetchInterval: 3000,
  })

  const { data: pickupAnalytics } = useQuery<any>({
    queryKey: ['analytics', 'pickups'],
    queryFn: () => api.get('/analytics/pickups').then(r => r.data),
    refetchInterval: 3000,
  })

  const { data: vehicleAnalytics } = useQuery<any>({
    queryKey: ['analytics', 'vehicles'],
    queryFn: () => api.get('/analytics/vehicles').then(r => r.data),
    refetchInterval: 3000,
  })

  // Export CSV Report Handler
  const handleExportCSV = () => {
    window.open(`http://localhost:8000/api/analytics/export/csv?range=${timeRange}`, '_blank')
  }

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="Commercial Analytics & Insights" subtitle="Database-driven reporting engine & regulatory compliance metrics">
      <div className="space-y-6">

        {/* ── 1. TOOLBAR, TIME RANGE FILTERS & CSV EXPORT ──────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Range Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-bold uppercase mr-1">Range:</span>
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
                { id: 'LAST_3_MONTHS', label: 'Last 3 Months' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setTimeRange(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === r.id
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-surface-850 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Updated: {secondsAgo}s ago
              </span>

              <button
                onClick={handleExportCSV}
                className="btn-primary text-xs px-4 py-2 shadow-lg shadow-brand-500/20"
              >
                <Download className="w-4 h-4" />
                Export CSV Report
              </button>
            </div>

          </div>
        </Card>

        {/* ── 2. SUMMARY AGGREGATION METRICS ───────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-brand-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Waste</p>
            <p className="text-2xl font-black text-white mt-1">{summary?.total_waste_liters ?? 0} L</p>
            <span className="text-[10px] text-slate-500">Aggregated database sum</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-bio">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biodegradable</p>
            <p className="text-2xl font-black text-bio mt-1">{summary?.biodegradable_waste_liters ?? 0} L</p>
            <span className="text-[10px] text-bio/80">Segregation: {summary?.segregation_percentage ?? 65}%</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-nonbio">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Non-Biodegradable</p>
            <p className="text-2xl font-black text-nonbio mt-1">{summary?.non_biodegradable_waste_liters ?? 0} L</p>
            <span className="text-[10px] text-nonbio/80">Landfill divert ratio</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-sim">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recycling Rate</p>
            <p className="text-2xl font-black text-sim mt-1">{summary?.recycling_percentage ?? 60}%</p>
            <span className="text-[10px] text-sim/80">ESG Compliance index</span>
          </Card>
        </div>

        {/* ── 3. VISUAL CHARTS 1 & 2 ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WasteGenerationChart data={wasteTrend?.data ?? []} isLoading={!wasteTrend} />
          </div>
          <div>
            <CategoryDistributionChart
              bioCount={categories?.biodegradable ?? 0}
              nonbioCount={categories?.non_biodegradable ?? 0}
              isLoading={!categories}
            />
          </div>
        </div>

        {/* ── 4. CHART 3: BIN FILL TREND TELEMETRY ──────────────────────────── */}
        <BinFillLevelChart bins={binAnalytics} isLoading={binAnalytics.length === 0} />

        {/* ── 5. CHARTS 4 & 5: PICKUP COMPLETION & VEHICLE UTILIZATION ─────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chart 4: Pickup Completion Performance */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pickup Logistics Performance</h3>
                <p className="text-xs text-slate-400">Database collection jobs analytics</p>
              </div>
              <Badge variant="online">{pickupAnalytics?.completion_rate ?? 95}% Completion</Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Pickup Completion Rate</span>
                  <span className="font-mono font-bold text-brand-400">{pickupAnalytics?.completion_rate ?? 95}%</span>
                </div>
                <ProgressBar value={pickupAnalytics?.completion_rate ?? 95} showLabel={false} />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Stops</p>
                  <p className="text-lg font-black text-white mt-0.5">{pickupAnalytics?.total_pickups ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Completed</p>
                  <p className="text-lg font-black text-bio mt-0.5">{pickupAnalytics?.completed ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">In Transit</p>
                  <p className="text-lg font-black text-yellow-500 mt-0.5">{pickupAnalytics?.in_transit ?? 0}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Chart 5: Vehicle Fleet Utilization */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fleet Vehicle Utilization</h3>
                <p className="text-xs text-slate-400">Active vs Available trucks</p>
              </div>
              <Badge variant="info">{vehicleAnalytics?.utilization_pct ?? 75}% Active</Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Fleet Utilization Ratio</span>
                  <span className="font-mono font-bold text-info">{vehicleAnalytics?.utilization_pct ?? 75}%</span>
                </div>
                <ProgressBar value={vehicleAnalytics?.utilization_pct ?? 75} showLabel={false} />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Fleet</p>
                  <p className="text-lg font-black text-white mt-0.5">{vehicleAnalytics?.total_fleet ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Available</p>
                  <p className="text-lg font-black text-brand-400 mt-0.5">{vehicleAnalytics?.available ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Dispatched</p>
                  <p className="text-lg font-black text-mixed mt-0.5">{vehicleAnalytics?.in_transit ?? 0}</p>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </PageWrapper>
  )
}
