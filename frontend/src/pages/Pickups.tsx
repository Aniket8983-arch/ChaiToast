import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, Clock, MapPin, Truck, User, Search, Filter,
  CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Check, X, ShieldAlert, Zap
} from 'lucide-react'
import api from '../lib/api'
import type { Pickup } from '../types'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { timeAgo, statusColor, cn } from '../lib/utils'

const LIFECYCLE_STEPS = [
  'SCHEDULED',
  'ASSIGNED',
  'IN_TRANSIT',
  'ARRIVED',
  'COLLECTED',
  'COMPLETED'
]

export default function Pickups() {
  const queryClient = useQueryClient()

  // State Management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [wasteTypeFilter, setWasteTypeFilter] = useState('ALL')
  const [selectedVehicle, setSelectedVehicle] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')

  // ── Automatic 3-second live database polling ─────────────────────────────
  const { data: pickups = [], isLoading, isError, dataUpdatedAt, refetch } = useQuery<any[]>({
    queryKey: ['pickups', searchTerm, statusFilter, priorityFilter, dateFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter)
      if (dateFilter) params.append('date', dateFilter)
      return api.get(`/pickups?${params.toString()}`).then(r => r.data)
    },
    refetchInterval: 3000,
  })

  // Fetch Fleet Vehicles for filter
  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  })

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/pickups/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  // Filter pickups locally for waste type & vehicle
  const filteredPickups = pickups.filter((p: any) => {
    if (wasteTypeFilter !== 'ALL' && p.waste_category !== wasteTypeFilter) return false
    if (selectedVehicle !== 'ALL' && p.vehicle_id !== selectedVehicle) return false
    return true
  })

  // Identify Operational Alert Items
  const delayedPickups = filteredPickups.filter(p => p.status === 'SCHEDULED' && p.priority === 'HIGH')
  const unassignedHighPriority = filteredPickups.filter(p => !p.assigned_vehicle && (p.priority === 'HIGH' || p.priority === 'URGENT'))

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="Pickup Monitoring & Operations" subtitle="Live dispatch tracking & step-by-step collection lifecycle">
      <div className="space-y-6">

        {/* ── 1. OPERATIONAL ALERTS BANNER ─────────────────────────────────── */}
        {(delayedPickups.length > 0 || unassignedHighPriority.length > 0) && (
          <div className="space-y-2">
            {unassignedHighPriority.map((p: any) => (
              <div key={p.id} className="p-3.5 rounded-xl bg-warn/10 border border-warn/30 text-warn text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">OPERATIONAL ALERT: Vehicle Unavailable</span>
                    <p className="text-[11px] text-slate-300">
                      High priority pickup for <strong>{p.establishment}</strong> ({p.waste_category}) is unassigned.
                    </p>
                  </div>
                </div>
                <Badge variant="warning">URGENT ACTION</Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── 2. FILTERS & SEARCH TOOLBAR ───────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search pickup ID, establishment, or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-field pl-9 py-2 text-xs w-full"
              />
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field py-2 text-xs min-w-[120px]"
              >
                <option value="ALL">All Statuses</option>
                {LIFECYCLE_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={wasteTypeFilter}
                onChange={e => setWasteTypeFilter(e.target.value)}
                className="input-field py-2 text-xs min-w-[120px]"
              >
                <option value="ALL">All Waste Types</option>
                <option value="BIO">BIODEGRADABLE</option>
                <option value="NONBIO">NON-BIODEGRADABLE</option>
                <option value="MIXED">MIXED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="input-field py-2 text-xs min-w-[110px]"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>

              <select
                value={selectedVehicle}
                onChange={e => setSelectedVehicle(e.target.value)}
                className="input-field py-2 text-xs min-w-[130px]"
              >
                <option value="ALL">All Vehicles</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.registration}</option>)}
              </select>

              <button onClick={() => refetch()} className="btn-secondary text-xs py-2 px-3">
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Showing {filteredPickups.length} pickup dispatch stops</span>
            <span>Last updated: {secondsAgo}s ago</span>
          </div>
        </Card>

        {/* ── 3. VISUAL LIFECYCLE CARDS LIST ────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-44 bg-surface-900 rounded-xl border border-slate-800 animate-pulse" />)}
          </div>
        ) : filteredPickups.length === 0 ? (
          <Card className="py-12 text-center text-slate-500 text-xs">No active pickup jobs match the selected filter query</Card>
        ) : (
          <div className="space-y-4">
            {filteredPickups.map((pickup: any) => {
              const currentStepIdx = LIFECYCLE_STEPS.indexOf(pickup.status)

              return (
                <Card key={pickup.id} className="p-5 space-y-4 border-slate-800">
                  
                  {/* Top Row: Meta info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-400">#{pickup.id.slice(0, 8)}</span>
                        <Badge variant={pickup.waste_category === 'BIO' ? 'bio' : 'nonbio'}>
                          {pickup.waste_category}
                        </Badge>
                        <Badge variant={pickup.priority === 'URGENT' ? 'critical' : pickup.priority === 'HIGH' ? 'warning' : 'default'}>
                          {pickup.priority}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{pickup.establishment}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {pickup.location}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {pickup.scheduled_date} at {pickup.scheduled_time ?? '10:00 AM'}
                      </div>
                      <span className="text-slate-500 text-[11px]">Est. Qty: {pickup.estimated_quantity} kg</span>
                      <span className="text-slate-500 text-[10px]">Updated: {timeAgo(pickup.updated_at)}</span>
                    </div>
                  </div>

                  {/* Middle Row: VISUAL LIFECYCLE STEPPER */}
                  <div className="py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Collection Progress Stepper</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isDone = currentStepIdx >= idx
                        const isCurrent = pickup.status === step

                        return (
                          <div
                            key={step}
                            className={cn(
                              'p-2 rounded-lg text-center transition-all border font-mono text-[10px] font-bold flex flex-col items-center justify-center gap-1',
                              isCurrent ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-md scale-105' :
                              isDone ? 'bg-surface-850 text-slate-300 border-slate-700' :
                              'bg-surface-900 text-slate-600 border-slate-800/80 opacity-60'
                            )}
                          >
                            <span className="text-[9px] text-slate-500">Step 0{idx + 1}</span>
                            <span>{step}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Bottom Row: Fleet & Action Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-brand-400" />
                        {pickup.assigned_vehicle ?? 'Unassigned Fleet'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {pickup.assigned_driver ?? 'Unassigned Driver'}
                      </span>
                    </div>

                    {/* Status Transition Control */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Advance Status:</span>
                      <select
                        value={pickup.status}
                        onChange={e => updateStatusMutation.mutate({ id: pickup.id, status: e.target.value })}
                        className="input-field py-1 text-xs bg-surface-850"
                      >
                        {LIFECYCLE_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
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
