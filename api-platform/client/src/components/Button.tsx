import { type ButtonHTMLAttributes, forwardRef } from 'react'

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-hover active:scale-[0.97]',
  secondary: 'bg-transparent text-ink border border-hairline hover:bg-surface-2 active:scale-[0.97]',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-1 active:scale-[0.97]',
  danger: 'bg-error text-white hover:brightness-110 active:scale-[0.97]',
} as const

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-3 text-base',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-[120ms] ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
)

Button.displayName = 'Button'
export default Button
