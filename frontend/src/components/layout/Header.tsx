import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Search, User, ShieldCheck, CheckCircle2, AlertTriangle, X, Check } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { Alert } from '../../types'
import Badge from '../ui/Badge'
import { timeAgo } from '../../lib/utils'

export default function Header() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false)

  // ── Automatic 3-second live database polling for active alerts ─────────────
  const { data: activeAlerts = [] } = useQuery<Alert[]>({
    queryKey: ['alerts', 'ACTIVE'],
    queryFn: () => api.get('/alerts?status=ACTIVE').then(r => r.data),
    refetchInterval: 3000,
  })

  // Resolve Alert Mutation
  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/alerts/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const resolveAllMutation = useMutation({
    mutationFn: () => api.post('/alerts/resolve-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <header className="h-16 bg-surface-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search bins, pickups, vehicles..."
          className="input-field pl-9 text-xs py-1.5 w-full bg-surface-850"
        />
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-4">

        {/* System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-850 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="font-semibold text-slate-300">System Normal</span>
        </div>

        {/* Notification Alert Bell Button */}
        <div className="relative">
          <button
            onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
            className="p-2 rounded-xl bg-surface-850 hover:bg-surface-800 border border-slate-800 text-slate-300 relative transition-all"
            title="Active System Notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-danger text-white text-[10px] font-black leading-none animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Active Alerts Dropdown Drawer */}
          {isAlertDrawerOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-surface-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active System Alerts</h4>
                </div>
                {activeAlerts.length > 0 && (
                  <button
                    onClick={() => resolveAllMutation.mutate()}
                    className="text-[11px] text-brand-400 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-6 h-6 text-brand-500/60" />
                  <span>No active system alerts</span>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {activeAlerts.map((alert: any) => (
                    <div key={alert.id} className="p-3 rounded-xl bg-surface-850 border border-slate-800 text-xs flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white">{alert.title}</span>
                          <Badge variant={alert.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400">{alert.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{timeAgo(alert.created_at)}</p>
                      </div>
                      <button
                        onClick={() => resolveMutation.mutate(alert.id)}
                        className="p-1 rounded bg-surface-800 hover:bg-brand-500/20 text-slate-400 hover:text-brand-400 border border-slate-700 transition-colors"
                        title="Resolve alert"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'OP'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-white">{user?.name || 'Operator'}</p>
            <p className="text-[10px] text-slate-400">{user?.role === 'ADMIN' ? 'Administrator' : 'Operations Staff'}</p>
          </div>
        </div>

      </div>
    </header>
  )
}
