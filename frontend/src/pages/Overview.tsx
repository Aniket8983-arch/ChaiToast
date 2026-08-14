import { useQuery } from '@tanstack/react-query'
import {
  Trash2, Truck, Brain, AlertTriangle, CheckCircle2,
  TrendingUp, Activity, MapPin, Cpu, ShieldCheck, RefreshCw,
  Clock, WifiOff
} from 'lucide-react'
import api from '../lib/api'
import type { DashboardOverview, Alert, Bin, Vehicle, Classification, DeviceStatus } from '../types'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import SimBanner from '../components/ui/SimBanner'
import WasteGenerationChart from '../components/charts/WasteGenerationChart'
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart'
import BinFillLevelChart from '../components/charts/BinFillLevelChart'
import { timeAgo, pct, statusColor, cn } from '../lib/utils'

function KPICard({
  icon: Icon, label, value, sub, color = 'text-brand-400', isLoading
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; isLoading?: boolean
}) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-surface-800 rounded animate-pulse mt-2" />
          ) : (
            <p className={`text-2xl font-black mt-1.5 ${color}`}>{value}</p>
          )}
          {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl bg-surface-850 border border-slate-800/80', color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  )
}

export default function Overview() {
  // ── Automatic 3-second live polling from backend APIs ─────────────────────
  const {
    data: summary,
    isLoading: loadingOverview,
    isError,
    dataUpdatedAt,
    refetch
  } = useQuery<any>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
    refetchInterval: 3000, // 3s live polling
  })

  // ── Fetch Waste Trend Data ─────────────────────────────────────────────
  const { data: wasteTrendData, isLoading: loadingTrend } = useQuery({
    queryKey: ['dashboard', 'waste-trends'],
    queryFn: () => api.get('/dashboard/waste-trends?days=7').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch Category Distribution ─────────────────────────────────────────
  const { data: catDistData, isLoading: loadingRatio } = useQuery({
    queryKey: ['dashboard', 'category-distribution'],
    queryFn: () => api.get('/dashboard/category-distribution').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch Bins Telemetry ─────────────────────────────────────────
  const { data: bins = [], isLoading: loadingBins } = useQuery<Bin[]>({
    queryKey: ['bins'],
    queryFn: () => api.get('/bins').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch Pickups ──────────────────────────────────────────────────────
  const { data: pickups = [], isLoading: loadingPickups } = useQuery<any[]>({
    queryKey: ['dashboard', 'upcoming-pickups'],
    queryFn: () => api.get('/dashboard/upcoming-pickups').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch Vehicles ───────────────────────────────────────────────
  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch Classifications ──────────────────────────────────
  const { data: classifications = [], isLoading: loadingClassifications } = useQuery<any[]>({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => api.get('/dashboard/recent-activity?limit=6').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch System Alerts ────────────────────────────────────────────────
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<Alert[]>({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => api.get('/dashboard/alerts').then(r => r.data),
    refetchInterval: 3000,
  })

  // ── Fetch IoT Device Health ────────────────────────────────────────────
  const { data: devices = [], isLoading: loadingDevices } = useQuery<DeviceStatus[]>({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then(r => r.data),
    refetchInterval: 5000,
  })

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="SaaS Operations Dashboard" subtitle="Live commercial waste segregation, telemetry & fleet logistics">
      <div className="space-y-6 pb-8">
        
        {/* Header Action & Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isError ? (
              <span className="px-3 py-1 rounded-lg bg-danger/20 text-danger border border-danger/30 text-xs font-bold flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                Backend Offline
              </span>
            ) : (
              <SimBanner active={summary?.simulation_active} />
            )}

            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Last updated: {secondsAgo}s ago
            </span>
          </div>

          <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>

        {/* ── SYSTEM STATUS PANEL ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3 bg-surface-900 border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Backend Engine</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              ONLINE
            </span>
          </Card>
          <Card className="p-3 bg-surface-900 border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database Link</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              SQLITE3
            </span>
          </Card>
          <Card className="p-3 bg-surface-900 border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Classification Model</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-info">
              <span className="w-2 h-2 rounded-full bg-info" />
              ACTIVE (waste_model.h5)
            </span>
          </Card>
          <Card className="p-3 bg-surface-900 border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IoT Simulation</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sim">
              <span className="w-2 h-2 rounded-full bg-sim animate-pulse" />
              {summary?.simulation_active ? 'RUNNING' : 'PAUSED'}
            </span>
          </Card>
        </div>

        {/* ── REQUIRED DASHBOARD CARDS (KPIs) ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            icon={Trash2}
            label="Total Waste"
            value={`${summary?.total_waste_liters ?? 0} L`}
            sub="Aggregated database volume"
            color="text-brand-400"
            isLoading={loadingOverview}
          />
          <KPICard
            icon={Brain}
            label="BIO Waste"
            value={`${(summary?.biodegradable_count ?? 0) * 12} L`}
            sub="Segregated organic waste"
            color="text-bio"
            isLoading={loadingOverview}
          />
          <KPICard
            icon={Trash2}
            label="NON-BIO Waste"
            value={`${(summary?.non_biodegradable_count ?? 0) * 12} L`}
            sub="Recyclables & dry waste"
            color="text-nonbio"
            isLoading={loadingOverview}
          />
          <KPICard
            icon={ShieldCheck}
            label="Segregation Rate"
            value={`${summary?.recycling_rate ?? 65.0}%`}
            sub="Target compliance: 80%+"
            color="text-brand-300"
            isLoading={loadingOverview}
          />
          <KPICard
            icon={MapPin}
            label="Active Pickups"
            value={summary?.active_pickups ?? 0}
            sub={`${summary?.completed_pickups ?? 0} completed jobs`}
            color="text-mixed"
            isLoading={loadingOverview}
          />
          <KPICard
            icon={Truck}
            label="Available Vehicles"
            value={`${summary?.available_vehicles ?? 0} / ${summary?.total_vehicles ?? 4}`}
            sub="Simulated GPS units active"
            color="text-brand-400"
            isLoading={loadingOverview}
          />
          <KPICard
            icon={AlertTriangle}
            label="Bins Near Full"
            value={summary?.bins_near_full ?? 0}
            sub={`${summary?.bins_critical ?? 0} critical overflow`}
            color={(summary?.bins_near_full ?? 0) > 0 ? 'text-danger' : 'text-slate-400'}
            isLoading={loadingOverview}
          />
          <KPICard
            icon={AlertTriangle}
            label="Critical Alerts"
            value={summary?.unresolved_alerts ?? 0}
            sub="Unresolved active warnings"
            color={(summary?.unresolved_alerts ?? 0) > 0 ? 'text-danger' : 'text-slate-400'}
            isLoading={loadingOverview}
          />
        </div>

        {/* ── CHARTS SECTIONS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WasteGenerationChart data={wasteTrendData?.data ?? []} isLoading={loadingTrend} />
          </div>
          <div>
            <CategoryDistributionChart
              bioCount={catDistData?.biodegradable ?? summary?.today_bio_count ?? 0}
              nonbioCount={catDistData?.non_biodegradable ?? summary?.today_nonbio_count ?? 0}
              isLoading={loadingRatio}
            />
          </div>
        </div>

        {/* Smart Bin Fill-Level Telemetry Chart */}
        <div>
          <BinFillLevelChart bins={bins} isLoading={loadingBins} />
        </div>

        {/* ── UPCOMING PICKUPS & VEHICLE FLEET STATUS ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upcoming Pickups */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming & Active Pickups</h3>
                <p className="text-xs text-slate-400 font-mono">Database queue</p>
              </div>
              <Badge variant="info">{pickups.length} Scheduled</Badge>
            </div>

            {loadingPickups ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />)}
              </div>
            ) : pickups.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No pending collection pickups scheduled</div>
            ) : (
              <div className="space-y-2.5">
                {pickups.slice(0, 5).map((pickup: any) => (
                  <div key={pickup.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-850 border border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-800 text-slate-300">
                        <MapPin className="w-4 h-4 text-brand-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{pickup.bin_id} — {pickup.zone}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Est. Fill: {pickup.fill_before_pct}%</p>
                      </div>
                    </div>
                    <Badge variant={pickup.status === 'COMPLETED' ? 'online' : pickup.status === 'EN_ROUTE' ? 'warning' : 'default'}>
                      {pickup.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Vehicle Status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vehicle Fleet Status</h3>
                <p className="text-xs text-slate-400 font-mono">Live fleet tracking</p>
              </div>
              <Badge variant="real">GPS Active</Badge>
            </div>

            {loadingVehicles ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-surface-800 rounded-lg animate-pulse" />)}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No registered fleet vehicles found</div>
            ) : (
              <div className="space-y-2.5">
                {vehicles.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-850 border border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-800">
                        <Truck className="w-4 h-4 text-mixed" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{v.registration} ({v.vehicle_type})</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Capacity: {v.capacity_liters} L • Fuel: {v.fuel_percent}%</p>
                      </div>
                    </div>
                    <Badge variant={v.status === 'AVAILABLE' ? 'online' : v.status === 'EN_ROUTE' ? 'warning' : 'offline'}>
                      {v.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── RECENT CLASSIFICATIONS, ALERTS, DEVICE HEALTH ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent AI Classifications */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent AI Scans</h3>
                <p className="text-xs text-slate-400">MobileNetV2 classification stream</p>
              </div>
              <Brain className="w-4 h-4 text-info" />
            </div>

            {loadingClassifications ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-surface-800 rounded animate-pulse" />)}
              </div>
            ) : classifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No recent AI scans logged</div>
            ) : (
              <div className="space-y-2">
                {classifications.slice(0, 5).map((clf: any) => (
                  <div key={clf.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-850 border border-slate-800/80 text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{clf.filename ?? 'scan_frame.jpg'}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(clf.timestamp)}</p>
                    </div>
                    <Badge variant={clf.label === 'BIO' ? 'bio' : 'nonbio'}>
                      {clf.display_label ?? (clf.label === 'BIO' ? 'BIODEGRADABLE' : 'NON-BIODEGRADABLE')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* System Alerts */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Alerts</h3>
                <p className="text-xs text-slate-400">Active alerts</p>
              </div>
              <Badge variant={alerts.length > 0 ? 'critical' : 'online'}>{alerts.length} Active</Badge>
            </div>

            {loadingAlerts ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-surface-800 rounded animate-pulse" />)}
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
                <CheckCircle2 className="w-6 h-6 text-brand-500/60" />
                <span>All systems normal</span>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-surface-850 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200">{a.title}</span>
                      <Badge variant={a.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Device Health */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Device Health</h3>
                <p className="text-xs text-slate-400">ESP32 telemetry nodes</p>
              </div>
              <Cpu className="w-4 h-4 text-sim" />
            </div>

            {loadingDevices ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-surface-800 rounded animate-pulse" />)}
              </div>
            ) : devices.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No registered IoT devices</div>
            ) : (
              <div className="space-y-2">
                {devices.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-850 border border-slate-800/80 text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">{d.device_label}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{d.device_type} • v{d.firmware_version}</p>
                    </div>
                    <Badge variant={d.status === 'ONLINE' ? 'online' : 'offline'}>
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>
    </PageWrapper>
  )
}
