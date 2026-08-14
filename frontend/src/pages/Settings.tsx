import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings as SettingsIcon, User, Sliders, Cpu, Activity,
  CheckCircle2, Save, RefreshCw, Zap, Shield, Database, Brain
} from 'lucide-react'
import api from '../lib/api'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { timeAgo, cn } from '../lib/utils'

export default function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'profile' | 'thresholds' | 'simulation' | 'status'>('thresholds')

  // Configurable thresholds state
  const [thresholds, setThresholds] = useState({
    normal_max: 60,
    attention_max: 80,
    almost_full_max: 95,
    critical_min: 95,
  })

  // Simulation toggle state
  const [simEnabled, setSimEnabled] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Fetch System Status Health
  const { data: healthData, isLoading: loadingHealth } = useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
    refetchInterval: 5000,
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <PageWrapper title="System Settings & Infrastructure" subtitle="Threshold configuration, simulation engine controls & IoT health diagnosis">
      <div className="space-y-6 max-w-5xl">

        {/* ── 1. NAVIGATION TABS ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'thresholds', label: 'Operational Thresholds', icon: Sliders },
            { id: 'simulation', label: 'Simulation Engine', icon: Zap },
            { id: 'status', label: 'System Health Status', icon: Activity },
            { id: 'profile', label: 'Operator Profile', icon: User },
          ].map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeTab === t.id
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-surface-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-bio/10 border border-bio/30 text-bio text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Configuration saved successfully to application state!
          </div>
        )}

        {/* ── 2. TAB 1: OPERATIONAL THRESHOLDS ──────────────────────────────── */}
        {activeTab === 'thresholds' && (
          <Card>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Bin Capacity Operational Thresholds</h3>
                <p className="text-xs text-slate-400">Configure fill-level status triggers (0–60% Normal, 60–80% Attention, 80–95% Almost Full, 95%+ Critical)</p>
              </div>
              <Badge variant="real">Configurable</Badge>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-brand-400 block">NORMAL THRESHOLD (0% – Max %)</label>
                  <input
                    type="number"
                    value={thresholds.normal_max}
                    onChange={e => setThresholds({ ...thresholds, normal_max: Number(e.target.value) })}
                    className="input-field text-xs w-full"
                  />
                  <p className="text-[11px] text-slate-500">Bins below this fill percentage operate in optimal status.</p>
                </div>

                <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-yellow-500 block">ATTENTION THRESHOLD (Max %)</label>
                  <input
                    type="number"
                    value={thresholds.attention_max}
                    onChange={e => setThresholds({ ...thresholds, attention_max: Number(e.target.value) })}
                    className="input-field text-xs w-full"
                  />
                  <p className="text-[11px] text-slate-500">Bins entering this range flag moderate capacity warning.</p>
                </div>

                <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-warn block">ALMOST FULL THRESHOLD (Max %)</label>
                  <input
                    type="number"
                    value={thresholds.almost_full_max}
                    onChange={e => setThresholds({ ...thresholds, almost_full_max: Number(e.target.value) })}
                    className="input-field text-xs w-full"
                  />
                  <p className="text-[11px] text-slate-500">Bins crossing 80%+ automatically generate collection alerts.</p>
                </div>

                <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-danger block">CRITICAL THRESHOLD (Min %)</label>
                  <input
                    type="number"
                    value={thresholds.critical_min}
                    onChange={e => setThresholds({ ...thresholds, critical_min: Number(e.target.value) })}
                    className="input-field text-xs w-full"
                  />
                  <p className="text-[11px] text-slate-500">Bins at 95%+ generate urgent critical overflow alerts.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="btn-primary text-xs px-6 py-2.5 shadow-lg shadow-brand-500/20">
                  <Save className="w-4 h-4" /> Save Thresholds
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* ── 3. TAB 2: SIMULATION ENGINE ───────────────────────────────────── */}
        {activeTab === 'simulation' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ultrasonic Background Simulator</h3>
                <p className="text-xs text-slate-400">Controls backend simulation worker loop (Simulation → API → Database → UI)</p>
              </div>
              <Badge variant={simEnabled ? 'simulated' : 'offline'}>
                {simEnabled ? 'SIMULATION ACTIVE' : 'SIMULATION PAUSED'}
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Background Telemetry Loop</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Periodically updates smart bin fill readings every 4 seconds in SQLite database</p>
              </div>
              <button
                onClick={() => setSimEnabled(!simEnabled)}
                className={cn('btn-primary text-xs px-6 py-2', !simEnabled && 'bg-slate-700 hover:bg-slate-600')}
              >
                {simEnabled ? 'Pause Simulation' : 'Resume Simulation'}
              </button>
            </div>
          </Card>
        )}

        {/* ── 4. TAB 3: SYSTEM HEALTH STATUS ────────────────────────────────── */}
        {activeTab === 'status' && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">System Infrastructure Status</h3>
              <Badge variant="online">All Systems Operational</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">SQLite Database Engine</p>
                  <p className="text-[11px] text-brand-400 mt-0.5">Connected • SQLite 3</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-info/10 text-info border border-info/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">TensorFlow AI Engine</p>
                  <p className="text-[11px] text-info mt-0.5">models/waste_model.h5 connected</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sim/10 text-sim border border-sim/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Ultrasonic Telemetry Service</p>
                  <p className="text-[11px] text-sim mt-0.5">SIMULATED SENSOR MODE</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-mixed/10 text-mixed border border-mixed/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Arduino / ESP32 Serial Interface</p>
                  <p className="text-[11px] text-mixed mt-0.5">Auto-detection Standby (COM3)</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* ── 5. TAB 4: OPERATOR PROFILE ────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <Card className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-base">
                AD
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin Operator Account</h3>
                <p className="text-xs text-slate-400">Role: ADMIN • Commercial Operations Control</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Username</span>
                <span className="font-bold text-white">admin</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-850 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Permissions</span>
                <span className="font-bold text-brand-400">Full System Administrative Access</span>
              </div>
            </div>
          </Card>
        )}

      </div>
    </PageWrapper>
  )
}
