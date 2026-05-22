import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Download, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../Button'

const finalTableau = [
  ['1', '0', '1.5', '-0.5', '3'],
  ['0', '1', '-0.5', '0.5', '1'],
  ['0', '0', '2.5', '1.5', '9'],
]

const iterations = [
  { tableau: [[1, 1, 1, 0, 4], [2, 1, 0, 1, 5], [-3, -2, 0, 0, 0]], entering: 'x1', leaving: 's2' },
  { tableau: [[0, 0.5, 1, -0.5, 1.5], [1, 0.5, 0, 0.5, 2.5], [0, -0.5, 0, 1.5, 7.5]], entering: 'x2', leaving: 's1' },
]

export default function ResultCard() {
  const [showTableau, setShowTableau] = useState(false)
  const [showIterations, setShowIterations] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Answer */}
      <div className="rounded-md border border-hairline bg-surface-2 p-4 space-y-2">
        <p className="text-xs text-success font-mono font-medium">✓ Optimal solution found</p>
        <p className="text-sm text-ink-muted">To maximize daily profit, produce:</p>
        <ul className="space-y-1">
          {[
            { label: 'Bread batches', value: '15', unit: 'batches' },
            { label: 'Cake batches', value: '10', unit: 'batches' },
            { label: 'Pastry batches', value: '5', unit: 'batches' },
          ].map((item) => (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-accent">•</span>
              <span className="text-ink font-medium">{item.value}</span>
              <span className="text-ink-muted">{item.label}</span>
            </motion.li>
          ))}
        </ul>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm font-semibold text-ink pt-1 border-t border-hairline"
        >
          Estimated maximum profit: <span className="text-success font-mono">₹1,550/day</span>
        </motion.p>
      </div>

      {/* Expandable sections */}
      <div className="space-y-2">
        {/* View Tableau */}
        <div className="rounded-md border border-hairline overflow-hidden">
          <button
            onClick={() => setShowTableau(!showTableau)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-ink-muted hover:text-ink hover:bg-surface-1 transition-colors cursor-pointer"
          >
            <span className="font-mono">View Final Tableau</span>
            {showTableau ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <AnimatePresence>
            {showTableau && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-hairline p-3 bg-canvas">
                  <table className="w-full font-mono text-xs border-collapse">
                    <thead>
                      <tr className="text-ink-tertiary">
                        <th className="px-2 py-1 text-left">x1</th>
                        <th className="px-2 py-1 text-left">x2</th>
                        <th className="px-2 py-1 text-left">s1</th>
                        <th className="px-2 py-1 text-left">s2</th>
                        <th className="px-2 py-1 text-left">RHS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalTableau.map((row, i) => (
                        <tr key={i} className="border-t border-hairline/50 text-ink-muted">
                          {row.map((cell, j) => (
                            <td key={j} className={`px-2 py-1 ${i === row.length - 1 ? 'text-ink font-medium border-t border-hairline-strong' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Iterations */}
        <div className="rounded-md border border-hairline overflow-hidden">
          <button
            onClick={() => setShowIterations(!showIterations)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-ink-muted hover:text-ink hover:bg-surface-1 transition-colors cursor-pointer"
          >
            <span className="font-mono">View Iterations</span>
            {showIterations ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <AnimatePresence>
            {showIterations && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-hairline p-3 bg-canvas space-y-4">
                  {iterations.map((iter, idx) => (
                    <div key={idx}>
                      <p className="text-xs font-mono text-accent mb-1">Iteration {idx}</p>
                      <p className="text-xs text-ink-tertiary mb-2">
                        Entering: <span className="text-ink-muted">{iter.entering}</span> · Leaving: <span className="text-ink-muted">{iter.leaving}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm">
          <Download size={14} />
          Export JSON
        </Button>
        <Link to="/playground">
          <Button variant="primary" size="sm">
            <ArrowUpRight size={14} />
            Open in Playground
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
