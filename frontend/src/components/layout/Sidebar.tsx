import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Brain, Trash2, Calendar, Truck,
  MapPin, ShieldCheck, BarChart3, Cpu, Settings, Recycle, LogOut, Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/overview',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/waste',      icon: Brain,           label: 'Waste AI' },
  { to: '/bins',       icon: Trash2,          label: 'Smart Bins' },
  { to: '/scheduling', icon: Calendar,        label: 'Collections' },
  { to: '/vehicles',   icon: Truck,           label: 'Vehicles' },
  { to: '/pickups',    icon: MapPin,          label: 'Pickups' },
  { to: '/compliance', icon: ShieldCheck,     label: 'Compliance' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
  { to: '/devices',    icon: Cpu,             label: 'Devices' },
  { to: '/settings',   icon: Settings,        label: 'Settings', adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  // Filter routes based on user roles
  const filteredNav = nav.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false
    return true
  })

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-surface-950 border-r border-slate-800/80 shadow-2xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-700/30 border border-brand-500/40 shadow-inner">
          <Recycle className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
            SmartWaste <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 font-mono">360</span>
          </h1>
          <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">AI & IoT Logistics</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation</p>
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-850'
              )
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Session & Logout Panel */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-surface-900/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-black text-sm">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'OP'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || 'Operator'}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role || 'OPERATOR'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-danger hover:bg-danger/10 border border-danger/10 hover:border-danger/25 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
