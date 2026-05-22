import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  onRemove?: () => void
  className?: string
}

const variants = {
  default: 'bg-accent-soft text-accent',
  success: 'bg-[rgba(39,166,68,0.15)] text-success',
  warning: 'bg-[rgba(245,166,35,0.15)] text-warning',
  error: 'bg-error-soft text-error',
  info: 'bg-[rgba(87,193,255,0.15)] text-info',
}

export default function Badge({ children, variant = 'default', onRemove, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium leading-5 ${variants[variant]} ${className}`}
    >
      {children}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-80 cursor-pointer" aria-label="Remove">
          <X size={12} />
        </button>
      )}
    </span>
  )
}
