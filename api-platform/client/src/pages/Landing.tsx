import { ArrowRight, Braces, Cpu, Eye, Key, Workflow, Table2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import HeroChat from '../components/hero-chat/HeroChat'

const solvers = [
  { name: 'Primal Simplex', description: 'Standard simplex algorithm for LP problems', icon: Workflow },
  { name: 'Dual Simplex', description: 'Dual simplex for sensitivity analysis', icon: Workflow },
  { name: 'Big M Method', description: 'Two-phase method for infeasible starts', icon: Workflow },
  { name: 'Transportation', description: 'Hitchcock transportation problem solver', icon: Table2 },
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-3 py-1 text-xs text-ink-muted mb-6">
              <Cpu size={12} className="text-accent" />
              MCP-Compatible · API-First
            </div>
            <h1 className="text-[clamp(32px,5vw,56px)] font-semibold leading-[1.05] text-ink -tracking-[0.04em] mb-4">
              Infrastructure for <br />
              <span className="text-accent">Optimization</span> APIs
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed mb-8 max-w-md">
              Expose LP solvers, simplex algorithms, and OR tools through clean APIs.
              AI-native, transparent, and built for developers.
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

      {/* Solvers */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-[clamp(24px,3vw,40px)] font-semibold leading-[1.1] text-ink -tracking-[0.03em] mb-3">
              Solver Suite
            </h2>
            <p className="text-ink-muted max-w-lg mx-auto">
              Every algorithm exposes structured inputs, iteration snapshots, and deterministic outputs.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {solvers.map((solver) => (
              <Card key={solver.name} hover className="flex flex-col gap-3">
                <solver.icon size={20} className="text-accent" />
                <h3 className="text-base font-semibold text-ink">{solver.name}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{solver.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API-First */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <Key size={20} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-ink">Bring Your Own Key</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Generate personal API keys, track usage, set rate limits. Infrastructure-style billing.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <Eye size={20} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-ink">Transparent Computation</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Watch every pivot, every tableau, every iteration. No black boxes.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
                <Braces size={20} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-ink">AI-Native Architecture</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Structured JSON schemas built for LLMs, MCP tools, and autonomous pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-16 md:py-20 text-center">
          <h2 className="text-[clamp(24px,3vw,32px)] font-semibold leading-[1.1] text-ink -tracking-[0.02em] mb-3">
            Start Optimizing
          </h2>
          <p className="text-ink-muted max-w-md mx-auto mb-8">
            Sign up to get your free API key with 2 requests per day. Subscribe to unlock unlimited access.
          </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/signup">
                <Button variant="primary" size="lg">Get Started Free</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="secondary" size="lg">View Pricing</Button>
              </Link>
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
