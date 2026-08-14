import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldCheck, AlertTriangle, Download, RefreshCw, CheckCircle2,
  AlertCircle, FileText, Info, Clock, Trash2, Filter
} from 'lucide-react'
import api from '../lib/api'
import PageWrapper from '../components/layout/PageWrapper'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { timeAgo, cn } from '../lib/utils'

export default function Compliance() {
  const [selectedRange, setSelectedRange] = useState('LAST_30_DAYS')
  const [establishmentFilter, setEstablishmentFilter] = useState('')

  // ── Automatic 3-second live database polling ─────────────────────────────
  const { data: summary, isLoading, isError, dataUpdatedAt, refetch } = useQuery<any>({
    queryKey: ['compliance', 'summary', selectedRange, establishmentFilter],
    queryFn: () => {
      const params = new URLSearchParams({ range: selectedRange })
      if (establishmentFilter) params.append('establishment', establishmentFilter)
      return api.get(`/compliance/summary?${params.toString()}`).then(r => r.data)
    },
    refetchInterval: 3000,
  })

  // Fetch Compliance Infraction Issues
  const { data: issues = [] } = useQuery<any[]>({
    queryKey: ['compliance', 'issues'],
    queryFn: () => api.get('/compliance/issues').then(r => r.data),
    refetchInterval: 3000,
  })

  const handleExportReport = () => {
    window.open('http://localhost:8000/api/compliance/export/report', '_blank')
  }

  const secondsAgo = dataUpdatedAt ? Math.floor((Date.now() - dataUpdatedAt) / 1000) : 0

  return (
    <PageWrapper title="Operational Compliance Audit" subtitle="Application-level operational standards & automated root-cause analysis">
      <div className="space-y-6">

        {/* ── 1. TOOLBAR & REPORT EXPORT ────────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase">Time Range:</span>
              <select
                value={selectedRange}
                onChange={e => setSelectedRange(e.target.value)}
                className="input-field py-1.5 text-xs bg-surface-850"
              >
                <option value="TODAY">Today</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="LAST_3_MONTHS">Last 3 Months</option>
              </select>

              <input
                type="text"
                placeholder="Filter by establishment..."
                value={establishmentFilter}
                onChange={e => setEstablishmentFilter(e.target.value)}
                className="input-field py-1.5 text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Updated: {secondsAgo}s ago
              </span>

              <button
                onClick={handleExportReport}
                className="btn-primary text-xs px-4 py-2 shadow-lg shadow-brand-500/20"
              >
                <Download className="w-4 h-4" />
                Export Compliance Report
              </button>
            </div>
          </div>
        </Card>

        {/* ── 2. OVERALL SCORE & CATEGORY BREAKDOWN ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Score Radial Card */}
          <Card className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-surface-900 to-surface-850 border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OVERALL COMPLIANCE SCORE</span>
            
            <div className="relative my-6 flex items-center justify-center">
              <div className={cn(
                'w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center shadow-2xl transition-all',
                (summary?.overall_score ?? 0) >= 80 ? 'border-brand-500 text-brand-400 shadow-brand-500/10' :
                (summary?.overall_score ?? 0) >= 60 ? 'border-yellow-500 text-yellow-500 shadow-yellow-500/10' :
                'border-danger text-danger shadow-danger/10'
              )}>
                <span className="text-4xl font-black">{summary?.overall_score ?? 0}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Calculated</span>
              </div>
            </div>

            <Badge variant={
              summary?.status === 'COMPLIANT' ? 'online' :
              summary?.status === 'NEEDS ATTENTION' ? 'warning' : 'critical'
            }>
              STATUS: {summary?.status ?? 'CALCULATING...'}
            </Badge>
          </Card>

          {/* Category Scores */}
          <Card className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Category Performance Breakdown</h3>
              <span className="text-xs text-slate-400">Database Metric Scores</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Waste Segregation (BIO vs NONBIO Ratio)</span>
                  <span className="font-mono font-bold text-bio">{summary?.scores?.segregation ?? 0}%</span>
                </div>
                <ProgressBar value={summary?.scores?.segregation ?? 0} showLabel={false} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Logistics & Collection Completion</span>
                  <span className="font-mono font-bold text-brand-400">{summary?.scores?.collection ?? 0}%</span>
                </div>
                <ProgressBar value={summary?.scores?.collection ?? 0} showLabel={false} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Recycling & Material Recovery</span>
                  <span className="font-mono font-bold text-sim">{summary?.scores?.recycling ?? 0}%</span>
                </div>
                <ProgressBar value={summary?.scores?.recycling ?? 0} showLabel={false} />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Operations & Alert Response</span>
                  <span className="font-mono font-bold text-info">{summary?.scores?.operations ?? 0}%</span>
                </div>
                <ProgressBar value={summary?.scores?.operations ?? 0} showLabel={false} />
              </div>
            </div>
          </Card>

        </div>

        {/* ── 3. ROOT CAUSE FINDINGS ("WHY IT HAPPENED") ────────────────────── */}
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Info className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Root Cause Analysis & Infraction Drivers</h3>
          </div>

          <div className="space-y-3">
            {summary?.root_causes?.map((cause: string, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-surface-850 border border-slate-800 text-xs flex items-start gap-3">
                <div className="p-1.5 rounded bg-surface-800 text-brand-400 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <p className="text-slate-200 leading-relaxed font-medium">{cause}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── 4. AUDIT INFRACTIONS TABLE ────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Infractions & Operational Alerts</h3>
            <span className="text-xs text-slate-400">{issues.length} Audit Events</span>
          </div>

          {issues.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-1">
              <CheckCircle2 className="w-6 h-6 text-brand-500/60" />
              <span>No active compliance infractions logged</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Entity / Location</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((item: any) => (
                    <tr key={item.id}>
                      <td className="font-mono text-xs text-slate-400">{item.id}</td>
                      <td className="font-bold text-white text-xs">{item.entity}</td>
                      <td>
                        <Badge variant="default">{item.category}</Badge>
                      </td>
                      <td>
                        <Badge variant={item.severity === 'CRITICAL' ? 'critical' : 'warning'}>
                          {item.severity}
                        </Badge>
                      </td>
                      <td className="text-xs text-slate-300 max-w-md">{item.description}</td>
                      <td className="text-xs text-slate-400 font-mono">{timeAgo(item.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </PageWrapper>
  )
}
