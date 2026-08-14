import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Truck, Navigation, MapPin, User, Activity, Clock, RefreshCw,
  Plus, Edit2, ShieldCheck, WifiOff, Zap
} from 'lucide-react'
import api from '../lib/api'
import type { Vehicle } from '../types'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { timeAgo, statusColor, cn } from '../lib/utils'

export default function Vehicles() {
  const queryClient = useQueryClient()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  // ── Automatic 3-second live database polling ─────────────────────────────
  const { data: vehicles = [], isLoading, isError, dataUpdatedAt, refetch } = useQuery<any[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    refetchInterval: 3000,
  })

  // Fetch live GPS location for selected vehicle
  const { data: liveLocation } = useQuery({
    queryKey: ['vehicles', selectedVehicleId, 'location'],
    queryFn: () => api.get(`/vehicles/${selectedVehicleId}/location`).then(r => r.data),
    enabled: !!selectedVehicleId,
    refetchInterval: 2000, // 2s smooth GPS polling
  })

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/vehicles/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="Fleet & Vehicle Tracking" subtitle="Logistics fleet management & simulated GPS movement engine">
      <div className="space-y-6">

        {/* ── 1. FLEET SUMMARY & TOOLBAR ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Badge variant="real">Fleet Size: {vehicles.length}</Badge>
            <Badge variant="online">Available: {vehicles.filter((v: any) => v.status === 'AVAILABLE').length}</Badge>
            <Badge variant="warning">In Transit: {vehicles.filter((v: any) => v.status === 'IN_TRANSIT' || v.status === 'ASSIGNED').length}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Last updated: {secondsAgo}s ago
            </span>

            {isError ? (
              <span className="px-2.5 py-1 rounded bg-danger/20 text-danger border border-danger/30 text-xs font-bold flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" />
                Backend Offline
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-sim/10 text-sim border border-sim/20 text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                SIMULATED GPS
              </span>
            )}

            <button onClick={() => refetch()} className="btn-secondary text-xs py-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Fleet
            </button>
          </div>
        </div>

        {/* ── 2. FLEET CARDS GRID ───────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-surface-900 rounded-xl border border-slate-800 animate-pulse" />)}
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="py-12 text-center text-slate-500 text-xs">No registered fleet vehicles found</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicles.map((v: any) => {
              const currentLoad = v.current_load ?? 0
              const capacity = v.capacity ?? 500
              const loadPct = Math.min(100, Math.round((currentLoad / capacity) * 100))

              return (
                <Card
                  key={v.id}
                  className={cn(
                    'flex flex-col justify-between border-l-4 transition-all',
                    v.status === 'AVAILABLE' ? 'border-l-brand-500' :
                    v.status === 'IN_TRANSIT' ? 'border-l-warn' :
                    v.status === 'ASSIGNED' ? 'border-l-info' : 'border-l-slate-700'
                  )}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-brand-400">{v.registration_number ?? v.registration}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('status-dot', statusColor[v.status])} />
                        <Badge variant={
                          v.status === 'AVAILABLE' ? 'online' :
                          v.status === 'IN_TRANSIT' ? 'warning' :
                          v.status === 'ASSIGNED' ? 'info' : 'default'
                        }>
                          {v.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Vehicle Type & Driver */}
                    <h4 className="text-sm font-bold text-white">{v.vehicle_type} Collection Truck</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {v.driver ?? v.driver_name ?? 'Unassigned Driver'}
                    </p>

                    {/* Current Load & Capacity Progress */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Load Utilization</span>
                        <span className="font-mono font-bold text-white">{currentLoad} / {capacity} kg ({loadPct}%)</span>
                      </div>
                      <ProgressBar value={loadPct} showLabel={false} />
                    </div>

                    {/* GPS Coordinates & Last Updated */}
                    <div className="mt-4 p-2.5 rounded-lg bg-surface-850 border border-slate-800 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-brand-400" /> Lat / Lng:
                        </span>
                        <span className="text-white font-bold">
                          {v.latitude?.toFixed(4)}, {v.longitude?.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Updated:</span>
                        <span>{timeAgo(v.last_updated)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Telemetry Source Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="simulated">SIMULATED LOCATION</Badge>
                      <button
                        onClick={() => setSelectedVehicleId(v.id)}
                        className="text-xs text-brand-400 font-semibold hover:underline"
                      >
                        Track GPS →
                      </button>
                    </div>

                    {/* Status Dropdown */}
                    <select
                      value={v.status}
                      onChange={e => updateStatusMutation.mutate({ id: v.id, status: e.target.value })}
                      className="input-field py-1 text-xs w-full bg-surface-850"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="AT_PICKUP">AT_PICKUP</option>
                      <option value="RETURNING">RETURNING</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="OFFLINE">OFFLINE</option>
                    </select>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* ── 3. LIVE VEHICLE GPS TRACKING DRAWER ───────────────────────────── */}
        {selectedVehicleId && liveLocation && (
          <Card className="border-brand-500/40 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Navigation className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Vehicle GPS Radar — {liveLocation.registration_number}</h3>
                  <p className="text-xs text-slate-400">Real-time coordinate stream from Python simulation engine</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="simulated">SIMULATED LOCATION</Badge>
                <button onClick={() => setSelectedVehicleId(null)} className="btn-secondary text-xs py-1 px-3">
                  Close Map
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2 font-mono text-xs">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Current Coordinates</p>
                <p className="text-xl font-black text-brand-400">{liveLocation.latitude}, {liveLocation.longitude}</p>
                <p className="text-slate-500 text-[11px]">Pune Logistics Route Segment</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2 font-mono text-xs">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Simulated Telemetry Speed</p>
                <p className="text-xl font-black text-white">{liveLocation.speed_kmh} km/h</p>
                <p className="text-slate-500 text-[11px]">Heading: {liveLocation.heading}° North-East</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2 font-mono text-xs">
                <p className="text-slate-400 font-bold uppercase tracking-wider">GPS Update Timestamp</p>
                <p className="text-sm font-bold text-slate-200">{timeAgo(liveLocation.last_updated)}</p>
                <p className="text-slate-500 text-[11px]">Source: Database State</p>
              </div>
            </div>
          </Card>
        )}

      </div>
    </PageWrapper>
  )
}
