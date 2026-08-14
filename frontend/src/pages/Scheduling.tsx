import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, Clock, Plus, Search, Filter, MapPin, Truck, User,
  CheckCircle2, AlertCircle, RefreshCw, X, Edit2, ChevronRight, WifiOff
} from 'lucide-react'
import api from '../lib/api'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { timeAgo, formatDateTime, cn } from '../lib/utils'

export default function Scheduling() {
  const queryClient = useQueryClient()

  // State Management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedPickup, setSelectedPickup] = useState<any | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    establishment: '',
    location: '',
    zone: 'Zone A',
    waste_category: 'BIO',
    estimated_quantity: 50,
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00 AM',
    priority: 'MEDIUM',
    vehicle_id: '',
    assigned_vehicle: '',
    assigned_driver: '',
  })

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

  // Fetch Available Fleet Vehicles
  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
  })

  // Fetch Drivers
  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ['drivers'],
    queryFn: () => api.get('/pickups/drivers').then(r => r.data).catch(() => []),
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createPickupMutation = useMutation({
    mutationFn: (newPickup: any) => api.post('/pickups', newPickup),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsCreateModalOpen(false)
      setFormData({
        establishment: '',
        location: '',
        zone: 'Zone A',
        waste_category: 'BIO',
        estimated_quantity: 50,
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '10:00 AM',
        priority: 'MEDIUM',
        vehicle_id: '',
        assigned_vehicle: '',
        assigned_driver: '',
      })
    },
  })

  const updatePickupMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => api.put(`/pickups/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedPickup(null)
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPickupMutation.mutate(formData)
  }

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="Collection Scheduling" subtitle="Logistics job dispatcher & vehicle allocation engine">
      <div className="space-y-6">

        {/* ── 1. TOOLBAR, SEARCH & FILTERS ──────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search establishment, zone, or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-field pl-9 py-2 text-xs w-full"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field py-2 text-xs min-w-[130px]"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="ARRIVED">ARRIVED</option>
                <option value="COLLECTED">COLLECTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="input-field py-2 text-xs min-w-[120px]"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="input-field py-2 text-xs"
              />

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary text-xs px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                Schedule Pickup
              </button>
            </div>
          </div>

          {/* Sync indicator */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Showing {pickups.length} scheduled stops</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Last updated: {secondsAgo}s ago
            </span>
          </div>
        </Card>

        {/* ── 2. UPCOMING PICKUPS TABLE / LIST ──────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pickup Logistics Queue</h3>
            <span className="text-xs text-slate-400">Source: Database Records</span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-surface-800 rounded animate-pulse" />)}
            </div>
          ) : pickups.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">No pickup records match the current filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Establishment</th>
                    <th>Location / Zone</th>
                    <th>Waste Type</th>
                    <th>Est. Qty</th>
                    <th>Scheduled Date/Time</th>
                    <th>Priority</th>
                    <th>Assigned Fleet</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pickups.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-bold text-white text-xs">{p.establishment}</td>
                      <td className="text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {p.location}
                        </span>
                      </td>
                      <td>
                        <Badge variant={p.waste_category === 'BIO' ? 'bio' : 'nonbio'}>
                          {p.waste_category}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs text-slate-200">{p.estimated_quantity} kg</td>
                      <td className="font-mono text-xs text-slate-300">
                        {p.scheduled_date} ({p.scheduled_time ?? '10:00 AM'})
                      </td>
                      <td>
                        <Badge variant={p.priority === 'URGENT' ? 'critical' : p.priority === 'HIGH' ? 'warning' : 'default'}>
                          {p.priority}
                        </Badge>
                      </td>
                      <td className="text-xs text-slate-300">
                        {p.assigned_vehicle ? (
                          <span className="flex items-center gap-1 font-mono text-brand-400">
                            <Truck className="w-3 h-3" />
                            {p.assigned_vehicle}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={
                          p.status === 'COMPLETED' ? 'online' :
                          p.status === 'IN_TRANSIT' ? 'warning' :
                          p.status === 'ASSIGNED' ? 'info' : 'default'
                        }>
                          {p.status}
                        </Badge>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedPickup(p)}
                          className="px-2.5 py-1 rounded bg-surface-800 hover:bg-surface-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── 3. CREATE PICKUP MODAL ────────────────────────────────────────── */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-400" />
                  Schedule Collection Pickup
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Establishment / Premises Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canteen Block A"
                    value={formData.establishment}
                    onChange={e => setFormData({ ...formData, establishment: e.target.value })}
                    className="input-field py-2 text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Location Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Building 4 Ground Fl"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="input-field py-2 text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Waste Category</label>
                    <select
                      value={formData.waste_category}
                      onChange={e => setFormData({ ...formData, waste_category: e.target.value })}
                      className="input-field py-2 text-xs w-full"
                    >
                      <option value="BIO">BIODEGRADABLE</option>
                      <option value="NONBIO">NON-BIODEGRADABLE</option>
                      <option value="MIXED">MIXED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Est. Qty (kg)</label>
                    <input
                      type="number"
                      value={formData.estimated_quantity}
                      onChange={e => setFormData({ ...formData, estimated_quantity: Number(e.target.value) })}
                      className="input-field py-2 text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                      className="input-field py-2 text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="input-field py-2 text-xs w-full"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle & Driver Assignment Dropdowns */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Assign Vehicle</label>
                    <select
                      value={formData.vehicle_id}
                      onChange={e => {
                        const v = vehicles.find(x => x.id === e.target.value)
                        setFormData({
                          ...formData,
                          vehicle_id: e.target.value,
                          assigned_vehicle: v ? `${v.registration} (${v.vehicle_type})` : '',
                          assigned_driver: v ? v.driver : formData.assigned_driver,
                        })
                      }}
                      className="input-field py-2 text-xs w-full"
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.registration} — {v.vehicle_type} ({v.status})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Assign Driver</label>
                    <input
                      type="text"
                      placeholder="Driver Name"
                      value={formData.assigned_driver}
                      onChange={e => setFormData({ ...formData, assigned_driver: e.target.value })}
                      className="input-field py-2 text-xs w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPickupMutation.isPending}
                    className="btn-primary text-xs px-6 py-2 shadow-lg shadow-brand-500/20"
                  >
                    Create & Save Pickup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 4. EDIT PICKUP MODAL ──────────────────────────────────────────── */}
        {selectedPickup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Update Pickup #{selectedPickup.id.slice(0, 8)}</h3>
                <button onClick={() => setSelectedPickup(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-bold text-white text-sm">{selectedPickup.establishment}</p>
                  <p className="text-slate-400">{selectedPickup.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Status Transition</label>
                    <select
                      value={selectedPickup.status}
                      onChange={e => setSelectedPickup({ ...selectedPickup, status: e.target.value })}
                      className="input-field py-2 text-xs w-full"
                    >
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="ARRIVED">ARRIVED</option>
                      <option value="COLLECTED">COLLECTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Assign Fleet Vehicle</label>
                    <select
                      value={selectedPickup.vehicle_id ?? ''}
                      onChange={e => {
                        const v = vehicles.find(x => x.id === e.target.value)
                        setSelectedPickup({
                          ...selectedPickup,
                          vehicle_id: e.target.value,
                          assigned_vehicle: v ? v.registration : selectedPickup.assigned_vehicle,
                          status: e.target.value ? 'ASSIGNED' : selectedPickup.status,
                        })
                      }}
                      className="input-field py-2 text-xs w-full"
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.registration} ({v.status})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button onClick={() => setSelectedPickup(null)} className="btn-secondary text-xs px-4 py-2">
                    Cancel
                  </button>
                  <button
                    onClick={() => updatePickupMutation.mutate({ id: selectedPickup.id, updates: selectedPickup })}
                    disabled={updatePickupMutation.isPending}
                    className="btn-primary text-xs px-6 py-2"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
