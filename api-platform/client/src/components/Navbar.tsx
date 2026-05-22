import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Cpu } from 'lucide-react'
import { useState } from 'react'
import Button from './Button'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/playground', label: 'Playground' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/docs', label: 'Docs' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5 text-ink font-semibold text-lg no-underline">
          <Cpu size={20} className="text-accent" />
          <span>OpsMCP</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 no-underline ${
                location.pathname === link.to
                  ? 'text-accent bg-accent-soft'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-1'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button variant="primary" size="sm">Get Started</Button>
        </div>

        <button
          className="md:hidden p-2 text-ink-muted hover:text-ink cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-hairline bg-surface-1 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline ${
                location.pathname === link.to
                  ? 'text-accent bg-accent-soft'
                  : 'text-ink-muted hover:text-ink'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t border-hairline">
            <Button variant="ghost" size="sm" className="flex-1">Sign In</Button>
            <Button variant="primary" size="sm" className="flex-1">Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  )
}
