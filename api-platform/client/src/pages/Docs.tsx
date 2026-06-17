import { useState } from 'react'
import { Book, ExternalLink } from 'lucide-react'
import CodeBlock from '../components/CodeBlock'
import Card from '../components/Card'
import Badge from '../components/Badge'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'simplex-solve', label: 'Simplex Solve' },
  { id: 'dual-simplex', label: 'Dual Simplex' },
  { id: 'big-m', label: 'Big M Method' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'errors', label: 'Errors' },
  { id: 'rate-limits', label: 'Rate Limits' },
]

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview')

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Book size={24} className="text-accent" />
        <div>
          <h1 className="text-[28px] font-semibold text-ink leading-tight -tracking-[0.02em]">Documentation</h1>
          <p className="text-sm text-ink-muted">Everything you need to use the Operations MCP Platform</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <nav className="space-y-1 sticky top-24 self-start">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                activeSection === s.id
                  ? 'text-accent bg-accent-soft font-medium'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-1'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="space-y-12">
          {/* Overview */}
          <section id="overview">
            <h2 className="text-xl font-semibold text-ink mb-3">Overview</h2>
            <p className="text-ink-muted mb-4 leading-relaxed">
              The Operations MCP Platform exposes linear programming and optimization
              solvers through a clean REST API. Every endpoint accepts structured JSON,
              returns deterministic results, and exposes full iteration history.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <Card>
                <p className="text-xs text-ink-tertiary mb-1">Base URL</p>
                <p className="text-sm text-ink font-mono">https://api.opsmcp.dev/v1</p>
              </Card>
              <Card>
                <p className="text-xs text-ink-tertiary mb-1">Content Type</p>
                <p className="text-sm text-ink font-mono">application/json</p>
              </Card>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="border-t border-hairline pt-8">
            <h2 className="text-xl font-semibold text-ink mb-3">Authentication</h2>
            <p className="text-ink-muted mb-4 leading-relaxed">
              Pass your API key in the <code className="text-accent font-mono text-xs bg-accent-soft px-1.5 py-0.5 rounded">Authorization</code> header.
            </p>
            <CodeBlock
              code={`curl -X POST https://api.opsmcp.dev/v1/simplex/solve \\
  -H "Authorization: Bearer opsmcp-..." \\
  -H "Content-Type: application/json" \\
  -d '{"objective": "max", "objective_coefficients": [3, 2], "constraints": [...]}'`}
              language="bash"
            />
          </section>

          {/* Simplex Solve */}
          <section id="simplex-solve" className="border-t border-hairline pt-8">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-ink">Simplex Solve</h2>
              <Badge variant="success">POST</Badge>
            </div>
            <p className="text-sm font-mono text-ink-muted mb-4">/v1/simplex/solve</p>
            <p className="text-ink-muted mb-4 leading-relaxed">
              Solve a linear programming problem using the standard primal simplex algorithm.
            </p>

            <h3 className="text-sm font-semibold text-ink mb-2">Request Body</h3>
            <CodeBlock
              code={`{
  "objective": "max" | "min",
  "objective_coefficients": [number],
  "constraints": [
    {
      "coefficients": [number],
      "operator": "<=" | ">=" | "=",
      "rhs": number
    }
  ],
  "non_negative": boolean
}`}
              language="json"
            />

            <h3 className="text-sm font-semibold text-ink mt-6 mb-2">Response</h3>
            <CodeBlock
              code={`{
  "status": "optimal" | "infeasible" | "unbounded",
  "solution": { "x1": number, "x2": number, ... },
  "objective_value": number,
  "iterations": [
    {
      "tableau": [[number]],
      "entering": string,
      "leaving": string,
      "pivot": { "row": number, "col": number }
    }
  ]
}`}
              language="json"
            />

            <h3 className="text-sm font-semibold text-ink mt-6 mb-2">Example</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <CodeBlock
                code={`POST /v1/simplex/solve
{
  "objective": "max",
  "objective_coefficients": [3, 2],
  "constraints": [
    { "coefficients": [1, 1], "operator": "<=", "rhs": 4 },
    { "coefficients": [2, 1], "operator": "<=", "rhs": 5 }
  ],
  "non_negative": true
}`}
                language="Request"
              />
              <CodeBlock
                code={`HTTP 200
{
  "status": "optimal",
  "solution": { "x1": 1, "x2": 3 },
  "objective_value": 9,
  "iterations": [
    { "tableau": [[1,1,1,0,4],[2,1,0,1,5],[-3,-2,0,0,0]],
      "entering": "x1", "leaving": "s2",
      "pivot": { "row": 1, "col": 0 } }
  ]
}`}
                language="Response"
              />
            </div>
          </section>

          {/* Dual Simplex */}
          <section id="dual-simplex" className="border-t border-hairline pt-8">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-ink">Dual Simplex</h2>
              <Badge variant="success">POST</Badge>
            </div>
            <p className="text-sm font-mono text-ink-muted mb-4">/v1/dual-simplex/solve</p>
            <p className="text-ink-muted mb-4 leading-relaxed">
              Dual simplex algorithm. Same request schema as Simplex Solve. Useful for sensitivity
              analysis and re-optimization after constraint changes.
            </p>
          </section>

          {/* Big M */}
          <section id="big-m" className="border-t border-hairline pt-8">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-ink">Big M Method</h2>
              <Badge variant="success">POST</Badge>
            </div>
            <p className="text-sm font-mono text-ink-muted mb-4">/v1/big-m/solve</p>
            <p className="text-ink-muted mb-4 leading-relaxed">
              Solves LP problems with artificial variables using the Big M penalty method.
              Extends the request schema with an optional <code className="text-accent font-mono text-xs bg-accent-soft px-1.5 py-0.5 rounded">big_m_penalty</code> field.
            </p>
          </section>

          {/* Transportation */}
          <section id="transportation" className="border-t border-hairline pt-8">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-ink">Transportation</h2>
              <Badge variant="success">POST</Badge>
            </div>
            <p className="text-sm font-mono text-ink-muted mb-4">/v1/transportation/solve</p>
            <p className="text-ink-muted mb-4 leading-relaxed">
              Solve the transportation (Hitchcock) problem with supply and demand constraints.
            </p>
            <CodeBlock
              code={`{
  "costs": [[number]],
  "supply": [number],
  "demand": [number]
}`}
              language="json"
            />
          </section>

          {/* Errors */}
          <section id="errors" className="border-t border-hairline pt-8">
            <h2 className="text-xl font-semibold text-ink mb-3">Errors</h2>
            <p className="text-ink-muted mb-4 leading-relaxed">
              The API uses conventional HTTP status codes. All errors return a JSON body.
            </p>
            <div className="space-y-3">
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="error">400</Badge>
                  <span className="text-sm text-ink font-medium">Bad Request</span>
                </div>
                <p className="text-xs text-ink-muted">Invalid JSON or missing required fields.</p>
                <CodeBlock code={`{ "error": "validation_error", "detail": "objective must be 'max' or 'min'" }`} language="json" className="mt-2" />
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="error">401</Badge>
                  <span className="text-sm text-ink font-medium">Unauthorized</span>
                </div>
                <p className="text-xs text-ink-muted">Missing or invalid API key.</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="error">422</Badge>
                  <span className="text-sm text-ink font-medium">Unprocessable</span>
                </div>
                <p className="text-xs text-ink-muted">Problem is infeasible or unbounded.</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="error">429</Badge>
                  <span className="text-sm text-ink font-medium">Rate Limited</span>
                </div>
                <p className="text-xs text-ink-muted">Too many requests. Retry after the window.</p>
              </Card>
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="border-t border-hairline pt-8">
            <h2 className="text-xl font-semibold text-ink mb-3">Rate Limits</h2>
            <p className="text-ink-muted mb-4 leading-relaxed">
              Rate limits depend on your plan. Standard limits are sent in response headers:
            </p>
            <CodeBlock
              code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1684764000`}
              language="http"
            />
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <Card>
                <p className="text-xs text-ink-tertiary mb-1">Free</p>
                <p className="text-sm text-ink font-mono">100 req/min</p>
              </Card>
              <Card>
                <p className="text-xs text-ink-tertiary mb-1">Pro</p>
                <p className="text-sm text-ink font-mono">1,000 req/min</p>
              </Card>
              <Card>
                <p className="text-xs text-ink-tertiary mb-1">Enterprise</p>
                <p className="text-sm text-ink font-mono">Custom</p>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-hairline pt-8 text-center">
            <p className="text-sm text-ink-tertiary">
              Questions?{' '}
              <a href="#" className="text-accent hover:text-accent-hover no-underline">
                Join our Discord <ExternalLink size={12} className="inline" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
