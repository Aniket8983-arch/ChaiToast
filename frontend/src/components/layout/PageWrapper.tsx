import Header from './Header'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function PageWrapper({ children, title, subtitle }: Props) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 overflow-auto animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-mono">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}
