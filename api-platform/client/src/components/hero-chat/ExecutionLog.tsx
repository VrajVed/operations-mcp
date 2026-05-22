import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const logLines = [
  { text: 'Calling Operations MCP...', icon: '⟐' as const, color: 'text-accent' },
  { text: 'Running simplex solver...', icon: '⟐' as const, color: 'text-accent' },
  { text: '  Iteration 0 — pivot: x1 enters, s2 leaves', icon: '→' as const, color: 'text-ink-muted' },
  { text: '  Iteration 1 — pivot: x2 enters, s1 leaves', icon: '→' as const, color: 'text-ink-muted' },
  { text: '  Convergence reached in 2 iterations', icon: '✓' as const, color: 'text-success' },
  { text: 'Status: optimal · obj: 1550', icon: '✓' as const, color: 'text-success' },
]

interface ExecutionLogProps {
  onComplete: () => void
}

export default function ExecutionLog({ onComplete }: ExecutionLogProps) {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    setRevealed(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      setRevealed(i)
      if (i >= logLines.length) {
        clearInterval(interval)
        setTimeout(onComplete, 900)
      }
    }, 650)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="rounded-md border border-hairline bg-canvas overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-hairline bg-surface-2">
        <span className="text-xs text-ink-tertiary font-mono">execution.log</span>
      </div>
      <div className="p-3 space-y-1 font-mono text-xs">
        {logLines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -4 }}
            animate={idx < revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={idx < revealed ? line.color : 'text-ink-tertiary/20'}
          >
            <span className="mr-2 inline-block w-4 text-center">{line.icon}</span>
            {line.text}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
