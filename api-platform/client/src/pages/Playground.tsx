import { useState } from 'react'
import { Play, StepForward, RotateCcw, Download, Workflow, ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { Textarea } from '../components/Input'

type SolverMethod = 'primal-simplex' | 'dual-simplex' | 'big-m'

const defaultProblem = `{
  "objective": "max",
  "objective_coefficients": [3, 2],
  "constraints": [
    { "coefficients": [1, 1], "operator": "<=", "rhs": 4 },
    { "coefficients": [2, 1], "operator": "<=", "rhs": 5 }
  ],
  "non_negative": true
}`

const methods: { value: SolverMethod; label: string }[] = [
  { value: 'primal-simplex', label: 'Primal Simplex' },
  { value: 'dual-simplex', label: 'Dual Simplex' },
  { value: 'big-m', label: 'Big M Method' },
]

export default function Playground() {
  const [input, setInput] = useState(defaultProblem)
  const [method, setMethod] = useState<SolverMethod>('primal-simplex')
  const [showResult, setShowResult] = useState(false)

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Workflow size={24} className="text-accent" />
        <div>
          <h1 className="text-[28px] font-semibold text-ink leading-tight -tracking-[0.02em]">Playground</h1>
          <p className="text-sm text-ink-muted">Define LP problems and step through algorithms</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Problem Definition</h2>
              <Badge variant="info">JSON</Badge>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[200px] text-xs leading-relaxed"
            />
            <div className="flex flex-wrap gap-2">
              {methods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    method === m.value
                      ? 'bg-accent text-white'
                      : 'bg-surface-2 text-ink-muted hover:text-ink border border-hairline'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowResult(true)}
              >
                <Play size={14} />
                Solve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowResult(false); setInput(defaultProblem) }}
              >
                <RotateCcw size={14} />
                Reset
              </Button>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Upload</h2>
            <div className="border-2 border-dashed border-hairline rounded-md p-6 text-center hover:border-hairline-strong transition-colors cursor-pointer">
              <p className="text-xs text-ink-muted">Drop a JSON file or click to browse</p>
            </div>
          </Card>
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-3 space-y-4">
          {showResult ? (
            <>
              {/* Tableau */}
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Initial Tableau</h2>
                  <Badge variant="success">Optimal</Badge>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full font-mono text-sm border-collapse">
                    <thead>
                      <tr className="bg-surface-2">
                        <th className="px-3 py-2 text-left text-xs text-ink-muted">x1</th>
                        <th className="px-3 py-2 text-left text-xs text-ink-muted">x2</th>
                        <th className="px-3 py-2 text-left text-xs text-ink-muted">s1</th>
                        <th className="px-3 py-2 text-left text-xs text-ink-muted">s2</th>
                        <th className="px-3 py-2 text-left text-xs text-ink-muted">RHS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-hairline text-ink-muted">
                        <td className="px-3 py-2">1</td>
                        <td className="px-3 py-2">1</td>
                        <td className="px-3 py-2 text-accent">1</td>
                        <td className="px-3 py-2">0</td>
                        <td className="px-3 py-2">4</td>
                      </tr>
                      <tr className="border-t border-hairline text-ink-muted">
                        <td className="px-3 py-2">2</td>
                        <td className="px-3 py-2 text-accent">1</td>
                        <td className="px-3 py-2">0</td>
                        <td className="px-3 py-2">1</td>
                        <td className="px-3 py-2">5</td>
                      </tr>
                      <tr className="border-t border-hairline bg-accent-soft/5">
                        <td className="px-3 py-2 font-semibold text-ink">-3</td>
                        <td className="px-3 py-2 font-semibold text-ink">-2</td>
                        <td className="px-3 py-2 font-semibold text-ink">0</td>
                        <td className="px-3 py-2 font-semibold text-ink">0</td>
                        <td className="px-3 py-2 font-semibold text-ink">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Controls & Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="space-y-2">
                  <h2 className="text-sm font-semibold text-ink">Controls</h2>
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm"><Play size={14} /> Play</Button>
                    <Button variant="secondary" size="sm"><StepForward size={14} /> Step</Button>
                    <Button variant="ghost" size="sm"><RotateCcw size={14} /></Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-tertiary">
                    <span>Iteration</span>
                    <span className="text-ink-muted font-mono">2</span>
                    <span className="text-ink-tertiary">/ 3</span>
                  </div>
                </Card>
                <Card className="space-y-2">
                  <h2 className="text-sm font-semibold text-ink">Metrics</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-ink-tertiary">Status</p>
                      <p className="text-sm text-success font-medium">Optimal</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-tertiary">Objective</p>
                      <p className="text-sm text-ink font-mono font-semibold">9</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-tertiary">Pivots</p>
                      <p className="text-sm text-ink font-mono">2</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-tertiary">Feasible</p>
                      <p className="text-sm text-success font-medium">Yes</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Export */}
              <div className="flex gap-2">
                <Button variant="secondary" size="sm"><Download size={14} /> Export JSON</Button>
                <Button variant="ghost" size="sm"><Download size={14} /> Export CSV</Button>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 gap-4">
              <Workflow size={40} className="text-ink-tertiary" />
              <p className="text-ink-muted text-sm">Define a problem and click Solve</p>
              <ArrowRight size={20} className="text-ink-tertiary" />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
