import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const jsonLines = [
  `{`,
  `  "tool": "simplex_solve",`,
  `  "input": {`,
  `    "objective": "max",`,
  `    "objective_coefficients": [40, 70, 50],`,
  `    "constraints": [`,
  `      { "coefficients": [2, 4, 3], "operator": "<=", "rhs": 120 },`,
  `      { "coefficients": [1, 3, 2], "operator": "<=", "rhs": 90 }`,
  `    ]`,
  `  }`,
  `}`,
]

function tokenizeLine(line: string) {
  const parts: { text: string; color: string }[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1)
      if (end === -1) break
      const content = line.slice(i, end + 1)
      const afterColon = line.slice(end + 1).trimStart().startsWith(':')
      parts.push({ text: content, color: afterColon ? 'text-accent' : 'text-success' })
      i = end + 1
    } else if (/[0-9]/.test(line[i])) {
      let num = ''
      while (i < line.length && (/[0-9.\-,]/.test(line[i]) || line[i] === ' ')) {
        num += line[i]
        i++
      }
      parts.push({ text: num, color: 'text-info' })
    } else if (/[\[\]{}()]/.test(line[i])) {
      parts.push({ text: line[i], color: 'text-ink-muted' })
      i++
    } else if (line[i] === ':') {
      parts.push({ text: ':', color: 'text-ink-tertiary' })
      i++
    } else if (line[i] === ',') {
      parts.push({ text: ',', color: 'text-ink-tertiary' })
      i++
    } else if (line[i] === '-' || line[i] === ' ') {
      parts.push({ text: line[i], color: 'text-ink-muted' })
      i++
    } else {
      parts.push({ text: line[i], color: 'text-ink-muted' })
      i++
    }
  }
  return parts
}

interface SchemaRevealProps {
  onComplete: () => void
}

export default function SchemaReveal({ onComplete }: SchemaRevealProps) {
  const [revealedLines, setRevealedLines] = useState(0)

  useEffect(() => {
    setRevealedLines(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      setRevealedLines(i)
      if (i >= jsonLines.length) {
        clearInterval(interval)
        setTimeout(onComplete, 800)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="rounded-md border border-hairline bg-canvas overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-hairline bg-surface-2">
        <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
        <span className="text-xs text-ink-tertiary font-mono ml-2">schema.json</span>
      </div>
      <pre className="p-3 overflow-x-auto scrollbar-thin text-xs leading-relaxed">
        <code className="font-mono">
          {jsonLines.map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={idx < revealedLines ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {idx < revealedLines ? (
                tokenizeLine(line).map((part, pidx) => (
                  <span key={pidx} className={part.color}>{part.text}</span>
                ))
              ) : (
                <span className="text-ink-tertiary/30">{line}</span>
              )}
            </motion.div>
          ))}
        </code>
      </pre>
    </div>
  )
}
