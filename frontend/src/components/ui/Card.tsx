import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({ children, className, hover = false, onClick }: Props) {
  return (
    <div
      className={cn(hover ? 'card-hover cursor-pointer' : 'card', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
