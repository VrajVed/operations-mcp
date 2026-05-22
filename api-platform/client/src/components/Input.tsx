import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-ink-muted font-medium">{label}</label>
      )}
      <input
        className={`rounded-md border bg-surface-1 px-3 py-2.5 text-ink placeholder:text-ink-tertiary transition-colors duration-150 font-mono text-sm ${
          error
            ? 'border-error bg-error-soft'
            : 'border-hairline focus:border-accent focus:ring-2 focus:ring-accent-soft'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm text-ink-muted font-medium">{label}</label>
      )}
      <textarea
        className={`rounded-md border bg-surface-1 px-3 py-2.5 text-ink placeholder:text-ink-tertiary transition-colors duration-150 font-mono text-sm resize-y min-h-[100px] ${
          error
            ? 'border-error bg-error-soft'
            : 'border-hairline focus:border-accent focus:ring-2 focus:ring-accent-soft'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
