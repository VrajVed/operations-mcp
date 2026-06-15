import { ArrowRight, Cpu, Eye, Terminal, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import HeroChat from '../components/hero-chat/HeroChat'

const solvers = [
  {
    name: 'Simplex',
    logic: 'Iterates across vertices of the feasible polytope, selecting entering and leaving variables until the objective reaches its optimum.',
    whenToUse: 'Standard linear programs with a known feasible starting point.',
  },
  {
    name: 'Dual Simplex',
    logic: 'Maintains dual feasibility while driving primal infeasibility to zero, making it efficient for re-optimization and sensitivity analysis.',
    whenToUse: 'Re-optimizing after constraint changes or when no primal-feasible start exists.',
  },
  {
    name: 'Gomory',
    logic: 'Generates cutting planes from fractional solutions to progressively tighten the feasible region until an integer optimum is found.',
    whenToUse: 'Integer linear programs where variables must take whole-number values.',
  },
  {
    name: 'Big M',
    logic: 'Introduces artificial variables penalized by a large constant M, guiding the search from an infeasible start to a feasible optimum.',
    whenToUse: 'LPs that lack an obvious initial feasible basis.',
  },
]

const features = [
  {
    icon: Terminal,
    title: 'JSON In, JSON Out',
    description: 'Every solver accepts a typed schema and returns structured results. No parsing, no guessing.',
  },
  {
    icon: Eye,
    title: 'Transparent Execution',
    description: 'Inspect iterations, entering and leaving variables, and final tableaux in every response.',
  },
  {
    icon: Zap,
    title: 'MCP-Ready',
    description: 'Built to plug into agent workflows, IDEs, and autonomous pipelines with tool-style calls.',
  },
]

const apiExample = `POST /v1/solve/simplex
{
  "objective": "max",
  "coefficients": [40, 70, 50],
  "constraints": [
    { "coefficients": [2, 4, 3], "operator": "<=", "rhs": 120 },
    { "coefficients": [1, 3, 2], "operator": "<=", "rhs": 90 }
  ]
}

// 200 OK
{
  "status": "optimal",
  "objective": 1550,
  "solution": { "x1": 15, "x2": 10, "x3": 5 },
  "iterations": 2,
  "tableau": [...]
}`

function SolverCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % solvers.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-lg border border-hairline bg-surface-1 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-2">
        <span className="text-xs text-ink-tertiary font-mono">solver.cycle</span>
        <div className="flex gap-1.5">
          {solvers.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === index ? 'bg-accent' : 'bg-ink-tertiary/30'
              }`}
              aria-label={`Show ${solvers[i].name}`}
            />
          ))}
        </div>
      </div>
      <div className="relative h-[280px] py-12 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 py-12 px-6 flex flex-col justify-center"
          >
            <h3 className="font-display text-[clamp(32px,5vw,56px)] font-semibold leading-none text-ink mb-5">
              {solvers[index].name}
            </h3>
            <div className="space-y-3 max-w-lg">
              <div>
                <span className="text-xs font-mono text-accent uppercase tracking-wider">How it works</span>
                <p className="text-sm text-ink-muted leading-relaxed mt-1">
                  {solvers[index].logic}
                </p>
              </div>
              <div>
                <span className="text-xs font-mono text-success uppercase tracking-wider">When to use</span>
                <p className="text-sm text-ink-muted leading-relaxed mt-1">
                  {solvers[index].whenToUse}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function SolverFlowchart() {
  return (
    <div className="mt-6 rounded-lg border border-hairline bg-surface-1 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-hairline bg-surface-2">
        <span className="text-xs text-ink-tertiary font-mono">algorithm.selector</span>
      </div>
      <div className="p-6 overflow-x-auto">
        <svg viewBox="0 0 560 420" className="w-full max-w-[560px] mx-auto" style={{ minWidth: '320px' }}>
          {/* Decision boxes */}
          <rect x="200" y="10" width="160" height="40" rx="4" fill="#141516" stroke="#34343a" strokeWidth="1" />
          <text x="280" y="35" textAnchor="middle" fill="#f7f8f8" fontSize="12" fontFamily="JetBrains Mono, monospace">Linear Program?</text>

          <rect x="200" y="90" width="160" height="40" rx="4" fill="#141516" stroke="#34343a" strokeWidth="1" />
          <text x="280" y="115" textAnchor="middle" fill="#f7f8f8" fontSize="12" fontFamily="JetBrains Mono, monospace">Integer variables?</text>

          <rect x="200" y="170" width="160" height="40" rx="4" fill="#141516" stroke="#34343a" strokeWidth="1" />
          <text x="280" y="195" textAnchor="middle" fill="#f7f8f8" fontSize="12" fontFamily="JetBrains Mono, monospace">Feasible basis?</text>

          <rect x="200" y="250" width="160" height="40" rx="4" fill="#141516" stroke="#34343a" strokeWidth="1" />
          <text x="280" y="275" textAnchor="middle" fill="#f7f8f8" fontSize="12" fontFamily="JetBrains Mono, monospace">Re-optimizing?</text>

          {/* Result boxes */}
          <rect x="430" y="90" width="110" height="40" rx="4" fill="#5e6ad2" fillOpacity="0.15" stroke="#5e6ad2" strokeWidth="1" />
          <text x="485" y="115" textAnchor="middle" fill="#828fff" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="600">Gomory</text>

          <rect x="20" y="170" width="110" height="40" rx="4" fill="#1c1d1e" stroke="#34343a" strokeWidth="1" />
          <text x="75" y="195" textAnchor="middle" fill="#62666d" fontSize="11" fontFamily="JetBrains Mono, monospace">Not supported</text>

          <rect x="430" y="170" width="110" height="40" rx="4" fill="#5e6ad2" fillOpacity="0.15" stroke="#5e6ad2" strokeWidth="1" />
          <text x="485" y="195" textAnchor="middle" fill="#828fff" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="600">Big M</text>

          <rect x="430" y="250" width="110" height="40" rx="4" fill="#5e6ad2" fillOpacity="0.15" stroke="#5e6ad2" strokeWidth="1" />
          <text x="485" y="275" textAnchor="middle" fill="#828fff" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="600">Dual Simplex</text>

          <rect x="225" y="370" width="110" height="40" rx="4" fill="#5e6ad2" fillOpacity="0.15" stroke="#5e6ad2" strokeWidth="1" />
          <text x="280" y="395" textAnchor="middle" fill="#828fff" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="600">Simplex</text>

          {/* Arrows */}
          <line x1="280" y1="50" x2="280" y2="90" stroke="#34343a" strokeWidth="1" />
          <polygon points="280,90 276,82 284,82" fill="#34343a" />
          <text x="288" y="75" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">yes</text>

          <line x1="200" y1="110" x2="130" y2="110" stroke="#34343a" strokeWidth="1" />
          <line x1="130" y1="110" x2="130" y2="170" stroke="#34343a" strokeWidth="1" />
          <polygon points="130,170 126,162 134,162" fill="#34343a" />
          <text x="135" y="145" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">no</text>

          <line x1="360" y1="110" x2="430" y2="110" stroke="#34343a" strokeWidth="1" />
          <polygon points="430,110 422,106 422,114" fill="#34343a" />
          <text x="385" y="105" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">yes</text>

          <line x1="280" y1="130" x2="280" y2="170" stroke="#34343a" strokeWidth="1" />
          <polygon points="280,170 276,162 284,162" fill="#34343a" />
          <text x="288" y="155" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">no</text>

          <line x1="360" y1="190" x2="430" y2="190" stroke="#34343a" strokeWidth="1" />
          <polygon points="430,190 422,186 422,194" fill="#34343a" />
          <text x="385" y="185" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">no</text>

          <line x1="280" y1="210" x2="280" y2="250" stroke="#34343a" strokeWidth="1" />
          <polygon points="280,250 276,242 284,242" fill="#34343a" />
          <text x="288" y="235" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">yes</text>

          <line x1="360" y1="270" x2="430" y2="270" stroke="#34343a" strokeWidth="1" />
          <polygon points="430,270 422,266 422,274" fill="#34343a" />
          <text x="385" y="265" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">yes</text>

          <line x1="280" y1="290" x2="280" y2="370" stroke="#34343a" strokeWidth="1" />
          <polygon points="280,370 276,362 284,362" fill="#34343a" />
          <text x="288" y="335" fill="#8a8f98" fontSize="10" fontFamily="JetBrains Mono, monospace">no</text>
        </svg>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 pt-20 md:pt-32 pb-24 md:pb-36">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <div className="font-mono text-xs text-ink-tertiary mb-6">
              <span className="text-accent">$</span> opsmcp --version v0.1.0 --mcp-compatible
            </div>
            <h1 className="font-pixel text-[clamp(52px,9vw,112px)] leading-[0.85] text-ink mb-6">
              OPERATIONS
              <br />
              <span className="text-accent">MCP</span>
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed mb-8 max-w-md">
              Run linear programming and operations research solvers through clean, structured interfaces. Inspect every pivot. Ship optimization into production.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/playground">
                <Button variant="primary" size="lg">
                  Try the Playground
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="secondary" size="lg">
                  Read the Docs
                </Button>
              </Link>
            </div>
          </div>
          <HeroChat />
        </div>
      </section>

      {/* API Preview */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            <div className="rounded-lg border border-hairline bg-canvas overflow-hidden order-2 md:order-1">
              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-hairline bg-surface-2">
                <div className="w-2 h-2 rounded-full bg-error/80" />
                <div className="w-2 h-2 rounded-full bg-warning/80" />
                <div className="w-2 h-2 rounded-full bg-success/80" />
                <span className="text-xs text-ink-tertiary font-mono ml-2">request.sh</span>
              </div>
              <pre className="p-4 overflow-x-auto scrollbar-thin text-xs leading-relaxed">
                <code className="font-mono text-ink-muted">{apiExample}</code>
              </pre>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-[clamp(24px,3vw,40px)] font-semibold leading-[1.1] text-ink mb-3">
                API-first by design
              </h2>
              <p className="text-ink-muted max-w-md mb-6">
                The API is the product. Send a schema, get a deterministic result with full execution history. No hidden steps.
              </p>
              <ul className="space-y-3">
                {[
                  'Typed request schemas',
                  'Iteration-level transparency',
                  'Key-based rate limiting',
                  'Streaming-ready architecture',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-ink-muted">
                    <span className="text-accent">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solvers */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-20">
          <div className="mb-12">
            <h2 className="font-pixel text-[clamp(36px,5vw,64px)] leading-[1] text-ink mb-3">
              ALGORITHMS
            </h2>
            <p className="text-ink-muted max-w-lg">
              A rotating library of deterministic OR algorithms, each exposed as a composable tool.
            </p>
          </div>
          <SolverCarousel />
          <SolverFlowchart />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                  <feature.icon size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <h2 className="font-display text-[clamp(48px,7vw,88px)] font-semibold leading-[0.9] text-ink mb-4">
                Start
                <br />
                <span className="text-accent">Now</span>
              </h2>
              <p className="text-lg text-ink-muted leading-relaxed mb-6 max-w-md">
                Deploy your first optimization call in under five minutes. No setup, no hidden steps.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Link to="/signup">
                  <Button variant="primary" size="lg">Start Building Free</Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="secondary" size="lg">View Pricing</Button>
                </Link>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <div className="font-pixel text-2xl text-ink mb-1">2</div>
                  <div className="text-ink-tertiary">Requests / day free</div>
                </div>
                <div>
                  <div className="font-pixel text-2xl text-ink mb-1">&lt;5m</div>
                  <div className="text-ink-tertiary">To first API call</div>
                </div>
                <div>
                  <div className="font-pixel text-2xl text-ink mb-1">0</div>
                  <div className="text-ink-tertiary">Credit card required</div>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-hairline bg-canvas overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-hairline bg-surface-2">
                <div className="w-2 h-2 rounded-full bg-error/80" />
                <div className="w-2 h-2 rounded-full bg-warning/80" />
                <div className="w-2 h-2 rounded-full bg-success/80" />
                <span className="text-xs text-ink-tertiary font-mono ml-2">getting-started.sh</span>
              </div>
              <pre className="p-4 overflow-x-auto scrollbar-thin text-xs leading-relaxed">
                <code className="font-mono text-ink-muted">{`$ opsmcp signup
✓ Account created

$ opsmcp keys create --name prod
✓ API key: opsmcp_sk_...

$ opsmcp solve simplex --file problem.json
✓ Status: optimal · obj: 1550`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ink-muted text-sm">
            <Cpu size={14} className="text-accent" />
            Operations MCP Platform
          </div>
          <p className="text-xs text-ink-tertiary">
            Infrastructure for computational reasoning.
          </p>
        </div>
      </footer>
    </div>
  )
}
