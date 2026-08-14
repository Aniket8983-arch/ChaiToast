import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Recycle, Shield, User as UserIcon, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(username, password)
      navigate('/overview')
    } catch (err: any) {
      setError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const autofill = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-bio/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Brand Logo Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/30 border border-brand-500/40 shadow-inner mb-4">
            <Recycle className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">SmartWaste 360</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium uppercase tracking-wider">Commercial Operations Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-900 border border-slate-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Log in to your account</h3>
            <p className="text-xs text-slate-500">Access administrative or operator dashboard controls.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-10 text-xs py-2.5 w-full"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-xs py-2.5 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-500/20"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Seeding Credentials for Demo Convenience */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Demo Accounts:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => autofill('admin', 'admin123')}
                className="p-2 text-[10px] text-slate-400 hover:text-white bg-surface-850 hover:bg-surface-800 border border-slate-800/60 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-brand-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> ADMIN
                </div>
                <div className="font-mono mt-0.5">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => autofill('operator', 'operator123')}
                className="p-2 text-[10px] text-slate-400 hover:text-white bg-surface-850 hover:bg-surface-800 border border-slate-800/60 rounded-xl text-left transition-all"
              >
                <div className="font-bold text-bio flex items-center gap-1">
                  <Recycle className="w-3 h-3" /> OPERATOR
                </div>
                <div className="font-mono mt-0.5">operator / operator123</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600">
          SmartWaste 360 Operations • All telemetry and logins are fully database-driven.
        </p>
      </div>
    </div>
  )
}
