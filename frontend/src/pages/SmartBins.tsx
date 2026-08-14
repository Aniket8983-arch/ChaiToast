import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Trash2, MapPin, Zap, RefreshCw, AlertTriangle, Play, Pause,
  RotateCcw, Activity, Cpu, CheckCircle2, WifiOff, Clock
} from 'lucide-react'
import api from '../lib/api'
import type { Bin, SensorReading } from '../types'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import SimBanner from '../components/ui/SimBanner'
import BinFillLevelChart from '../components/charts/BinFillLevelChart'
import { statusColor, timeAgo, formatTime, cn } from '../lib/utils'

export default function SmartBins() {
  const queryClient = useQueryClient()
  const [selectedZone, setSelectedZone] = useState<string>('ALL')
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null)

  // ── Automatic 3-second live polling from database ─────────────────────────
  const { data: bins = [], isLoading, isError, dataUpdatedAt, refetch } = useQuery<Bin[]>({
    queryKey: ['bins'],
    queryFn: () => api.get('/bins').then(r => r.data),
    refetchInterval: 3000, // Automatic 3s live polling
  })

  // Fetch readings for selected bin modal/chart
  const { data: selectedReadings = [] } = useQuery<SensorReading[]>({
    queryKey: ['bins', selectedBinId, 'readings'],
    queryFn: () => selectedBinId ? api.get(`/bins/${selectedBinId}/readings`).then(r => r.data) : Promise.resolve([]),
    enabled: !!selectedBinId,
    refetchInterval: 3000,
  })

  // ── Simulation Control Mutations ──────────────────────────────────────────
  const startSimMutation = useMutation({
    mutationFn: (binId: string) => api.post(`/simulation/bins/${binId}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bins'] }),
  })

  const stopSimMutation = useMutation({
    mutationFn: (binId: string) => api.post(`/simulation/bins/${binId}/stop`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bins'] }),
  })

  const resetSimMutation = useMutation({
    mutationFn: (binId: string) => api.post(`/simulation/bins/${binId}/reset`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bins'] }),
  })

  // ── Calculated Threshold Counts ───────────────────────────────────────────
  const totalBinsCount   = bins.length
  const normalBinsCount  = bins.filter(b => b.current_fill_pct < 60.0).length
  const attentionCount   = bins.filter(b => b.current_fill_pct >= 60.0 && b.current_fill_pct < 80.0).length
  const almostFullCount  = bins.filter(b => b.current_fill_pct >= 80.0 && b.current_fill_pct < 95.0).length
  const criticalCount    = bins.filter(b => b.current_fill_pct >= 95.0).length
  const offlineCount     = bins.filter(b => b.status === 'OFFLINE').length

  const zones = ['ALL', ...Array.from(new Set(bins.map(b => b.zone)))]
  const filteredBins = selectedZone === 'ALL' ? bins : bins.filter(b => b.zone === selectedZone)

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="Smart Bin Management" subtitle="Ultrasonic fill-level sensor telemetry & background simulation engine">
      <div className="space-y-6">

        {/* ── 1. OPERATIONAL THRESHOLD SUMMARY COUNTERS (KPIs) ──────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Card className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bins</p>
            <p className="text-2xl font-black text-white mt-1">{totalBinsCount}</p>
            <span className="text-[10px] text-slate-500">Monitored nodes</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-brand-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Normal (0–60%)</p>
            <p className="text-2xl font-black text-brand-400 mt-1">{normalBinsCount}</p>
            <span className="text-[10px] text-brand-500/80">Optimal capacity</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-yellow-500">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attention (60–80%)</p>
            <p className="text-2xl font-black text-yellow-500 mt-1">{attentionCount}</p>
            <span className="text-[10px] text-yellow-500/80">Moderate fill</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-warn">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Almost Full (80–95%)</p>
            <p className="text-2xl font-black text-warn mt-1">{almostFullCount}</p>
            <span className="text-[10px] text-warn/80">Schedule pickup</span>
          </Card>

          <Card className="p-4 border-l-4 border-l-danger">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical (95%+)</p>
            <p className="text-2xl font-black text-danger mt-1">{criticalCount}</p>
            <span className="text-[10px] text-danger/80">Immediate action</span>
          </Card>

          <Card className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offline Devices</p>
            <p className="text-2xl font-black text-slate-400 mt-1">{offlineCount}</p>
            <span className="text-[10px] text-slate-500">Sensor offline</span>
          </Card>
        </div>

        {/* ── 2. TOOLBAR & STATUS INDICATORS ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-bold uppercase mr-1">Zone:</span>
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  selectedZone === z
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-surface-900 border border-slate-800 text-slate-400 hover:text-white'
                )}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Last updated indicator */}
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Last updated: {secondsAgo}s ago
            </span>

            {/* Backend offline state banner */}
            {isError ? (
              <span className="px-2.5 py-1 rounded bg-danger/20 text-danger border border-danger/30 text-xs font-bold flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" />
                Backend Offline
              </span>
            ) : (
              <SimBanner />
            )}

            <button onClick={() => refetch()} className="btn-secondary text-xs py-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </button>
          </div>
        </div>

        {/* ── 3. BINS TELEMETRY GRID ────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-56 bg-surface-900 rounded-xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredBins.length === 0 ? (
          <Card className="py-12 text-center text-slate-500 text-xs">No data available for the selected zone filter</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredBins.map((bin) => {
              const fillPct = bin.current_fill_pct
              const distanceCm = (50.0 * (1.0 - (fillPct / 100.0))).toFixed(1)

              // Operational threshold badge
              const thresholdStatus =
                fillPct >= 95.0 ? { label: 'CRITICAL', color: 'bg-danger/20 text-danger border-danger/30' } :
                fillPct >= 80.0 ? { label: 'ALMOST FULL', color: 'bg-warn/20 text-warn border-warn/30' } :
                fillPct >= 60.0 ? { label: 'ATTENTION', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' } :
                                  { label: 'NORMAL', color: 'bg-brand-500/20 text-brand-400 border-brand-500/30' }

              return (
                <Card
                  key={bin.id}
                  className={cn(
                    'flex flex-col justify-between border-l-4 transition-all hover:border-slate-700',
                    fillPct >= 95.0 ? 'border-l-danger' :
                    fillPct >= 80.0 ? 'border-l-warn' :
                    fillPct >= 60.0 ? 'border-l-yellow-500' : 'border-l-brand-500'
                  )}
                >
                  <div>
                    {/* Header Row: ID, Status & Threshold */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-brand-400">{bin.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('status-dot', statusColor[bin.status])} />
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', thresholdStatus.color)}>
                          {thresholdStatus.label}
                        </span>
                      </div>
                    </div>

                    {/* Bin Name & Location */}
                    <h4 className="text-sm font-bold text-white truncate">{bin.label}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      {bin.location_address ?? `${bin.zone} (${bin.location_lat.toFixed(3)}, ${bin.location_lng.toFixed(3)})`}
                    </p>

                    {/* Fill Level Meter & Ultrasonic Distance */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Capacity: {bin.capacity_liters}L</span>
                        <span className="font-mono font-bold text-white">{Math.round(fillPct)}%</span>
                      </div>
                      <ProgressBar value={fillPct} showLabel={false} />

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                        <span>Distance: {distanceCm} cm</span>
                        <span>{timeAgo(bin.updated_at ?? bin.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={bin.category.toLowerCase() as any}>{bin.category}</Badge>
                      <Badge variant="simulated">SIMULATED SENSOR DATA</Badge>
                    </div>

                    {/* Simulation Action Controls */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => startSimMutation.mutate(bin.id)}
                        disabled={startSimMutation.isPending}
                        className="px-2 py-1 rounded bg-surface-800 hover:bg-brand-500/20 text-[10px] font-semibold text-brand-400 border border-slate-700 hover:border-brand-500/40 transition-colors flex items-center gap-1"
                        title="Start background fill simulation"
                      >
                        <Play className="w-3 h-3" /> Start
                      </button>

                      <button
                        onClick={() => stopSimMutation.mutate(bin.id)}
                        disabled={stopSimMutation.isPending}
                        className="px-2 py-1 rounded bg-surface-800 hover:bg-surface-700 text-[10px] font-semibold text-slate-400 border border-slate-700 transition-colors flex items-center gap-1"
                        title="Pause fill simulation"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>

                      <button
                        onClick={() => resetSimMutation.mutate(bin.id)}
                        disabled={resetSimMutation.isPending}
                        className="px-2 py-1 rounded bg-surface-800 hover:bg-warn/20 text-[10px] font-semibold text-warn border border-slate-700 hover:border-warn/40 transition-colors flex items-center gap-1"
                        title="Reset fill to 5%"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
