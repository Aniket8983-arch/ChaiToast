import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Cpu, Wifi, WifiOff, Activity, RefreshCw, Zap, ShieldCheck,
  CheckCircle2, Clock, MapPin, Radio
} from 'lucide-react'
import api from '../lib/api'
import type { DeviceStatus } from '../types'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { timeAgo, cn } from '../lib/utils'

export default function Devices() {
  // ── Automatic 3-second live database polling ─────────────────────────────
  const { data: devices = [], isLoading, isError, dataUpdatedAt, refetch } = useQuery<any[]>({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then(r => r.data),
    refetchInterval: 3000,
  })

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="IoT Device Management & Sensors" subtitle="ESP32 telemetry nodes, hardware registries & simulated ultrasonic sensors">
      <div className="space-y-6">

        {/* ── 1. HARDWARE PROTOTYPE CONTRACT NOTICE ─────────────────────────── */}
        <div className="p-4 rounded-xl bg-sim/10 border border-sim/20 text-sim text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-bold">PROTOTYPE TELEMETRY CONTRACT</span>
              <p className="text-[11px] text-slate-300">
                Ultrasonic fill-level sensor telemetry is operated via background simulation engine (Status: <strong>SIMULATION</strong>, Data Source: <strong>SIMULATED</strong>).
              </p>
            </div>
          </div>
          <Badge variant="simulated">SIMULATED SENSORS</Badge>
        </div>

        {/* ── 2. SUMMARY COUNTERS & TOOLBAR ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="online">Online: {devices.filter(d => d.connection_status === 'ONLINE').length}</Badge>
            <Badge variant="simulated">Simulation: {devices.filter(d => d.connection_status === 'SIMULATION' || d.data_source === 'SIMULATED').length}</Badge>
            <Badge variant="offline">Offline: {devices.filter(d => d.connection_status === 'OFFLINE').length}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Updated: {secondsAgo}s ago
            </span>
            <button onClick={() => refetch()} className="btn-secondary text-xs py-1">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Nodes
            </button>
          </div>
        </div>

        {/* ── 3. DEVICE CARDS GRID ─────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-56 bg-surface-900 rounded-xl border border-slate-800 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device: any) => {
              const isUltrasonic = device.device_type === 'ULTRASONIC_SENSOR' || device.device_name?.includes('Ultrasonic')
              const statusBadge =
                device.connection_status === 'SIMULATION' || isUltrasonic ? 'simulated' :
                device.connection_status === 'ONLINE' ? 'online' : 'offline'

              return (
                <Card
                  key={device.id}
                  className={cn(
                    'flex flex-col justify-between border-l-4 transition-all',
                    isUltrasonic ? 'border-l-sim' :
                    device.connection_status === 'ONLINE' ? 'border-l-brand-500' : 'border-l-slate-700'
                  )}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-brand-400">{device.device_id}</span>
                      <Badge variant={statusBadge as any}>
                        {isUltrasonic ? 'SIMULATION' : device.connection_status}
                      </Badge>
                    </div>

                    {/* Device Label & Type */}
                    <h4 className="text-base font-bold text-white">{device.device_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Type: <span className="font-mono text-slate-300">{device.device_type}</span></p>
                    
                    {/* Associated Bin */}
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Associated Bin: <strong className="text-white">{device.associated_bin}</strong>
                    </p>

                    {/* Health Indicators */}
                    <div className="mt-4 p-3 rounded-lg bg-surface-850 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Firmware:</span>
                        <span className="text-white font-bold">{device.firmware_version}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Serial Port:</span>
                        <span className="text-brand-400 font-bold">{device.serial_port ?? 'COM3'} (9600 baud)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Last Seen:</span>
                        <span>{timeAgo(device.last_seen)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Telemetry Source Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <Badge variant={device.data_source === 'REAL' ? 'real' : 'simulated'}>
                      {device.data_source === 'REAL' ? 'REAL DEVICE' : 'SIMULATED DEVICE'}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono">Uptime: {Math.floor(device.uptime_seconds / 3600)}h</span>
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
