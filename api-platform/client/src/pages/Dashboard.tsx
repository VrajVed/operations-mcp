import { useState } from 'react'
import { Key, Copy, Eye, EyeOff, RefreshCw, Activity, BarChart3, Terminal } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table from '../components/Table'
import { Input } from '../components/Input'
import CodeBlock from '../components/CodeBlock'

const apiKeysData = [
  { key: 'sk_live_...a1b2', name: 'Production Key', created: '2026-05-20', usage: '1,234 req', status: 'Active' },
  { key: 'sk_test_...c3d4', name: 'Test Key', created: '2026-05-19', usage: '567 req', status: 'Active' },
  { key: 'sk_live_...e5f6', name: 'CI/CD Key', created: '2026-05-15', usage: '89 req', status: 'Active' },
  { key: 'sk_prev_...g7h8', name: 'Old Key (rotated)', created: '2026-04-01', usage: '12,340 req', status: 'Revoked' },
]

const requestLogs = [
  { method: 'POST', endpoint: '/v1/simplex/solve', status: 200, latency: '142ms', timestamp: '2026-05-22 14:32:01', key: 'sk_live' },
  { method: 'POST', endpoint: '/v1/simplex/solve', status: 200, latency: '98ms', timestamp: '2026-05-22 14:31:45', key: 'sk_live' },
  { method: 'GET', endpoint: '/v1/health', status: 200, latency: '4ms', timestamp: '2026-05-22 14:30:00', key: '-' },
  { method: 'POST', endpoint: '/v1/transportation/solve', status: 422, latency: '12ms', timestamp: '2026-05-22 14:28:12', key: 'sk_test' },
  { method: 'POST', endpoint: '/v1/simplex/solve', status: 200, latency: '156ms', timestamp: '2026-05-22 14:25:33', key: 'sk_live' },
]

const usageByEndpoint = [
  { endpoint: 'simplex.solve', calls: '23,451', p50: '87ms', p95: '234ms', errors: '0.12%' },
  { endpoint: 'dual-simplex.solve', calls: '8,902', p50: '112ms', p95: '298ms', errors: '0.08%' },
  { endpoint: 'big-m.solve', calls: '4,567', p50: '145ms', p95: '389ms', errors: '0.21%' },
  { endpoint: 'transportation.solve', calls: '1,234', p50: '67ms', p95: '156ms', errors: '0.03%' },
]

export default function Dashboard() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [newKeyName, setNewKeyName] = useState('')

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Key size={24} className="text-accent" />
        <div>
          <h1 className="text-[28px] font-semibold text-ink leading-tight -tracking-[0.02em]">API Dashboard</h1>
          <p className="text-sm text-ink-muted">Manage keys, monitor usage, track costs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <Activity size={14} />
            Total Requests
          </div>
          <p className="text-xl font-semibold text-ink font-mono">38,154</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <Key size={14} />
            Active Keys
          </div>
          <p className="text-xl font-semibold text-ink font-mono">3</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <BarChart3 size={14} />
            Avg Latency
          </div>
          <p className="text-xl font-semibold text-ink font-mono">89ms</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <Terminal size={14} />
            Error Rate
          </div>
          <p className="text-xl font-semibold text-ink font-mono">0.11%</p>
        </Card>
      </div>

      {/* API Keys */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">API Keys</h2>
          <Button variant="primary" size="sm">
            <Key size={14} />
            Generate Key
          </Button>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
            />
            <Button variant="secondary" size="sm">
              <RefreshCw size={14} />
              Create
            </Button>
          </div>
        </div>
        <Table
          columns={[
            { key: 'key', header: 'Key', className: 'font-mono text-xs' },
            { key: 'name', header: 'Name' },
            { key: 'created', header: 'Created' },
            { key: 'usage', header: 'Usage', className: 'font-mono' },
            {
              key: 'status',
              header: 'Status',
              render: (val) => (
                <Badge variant={val === 'Active' ? 'success' : 'error'}>{val as string}</Badge>
              ),
            },
            {
              key: 'key',
              header: '',
              render: (_val, row) => {
                const rowKey = String(row.key)
                return (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowKey({ ...showKey, [rowKey]: !showKey[rowKey] })}
                      className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      aria-label="Toggle key visibility"
                    >
                      {showKey[rowKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                      aria-label="Copy key"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                )
              },
            },
          ]}
          data={apiKeysData as unknown as Record<string, unknown>[]}
        />
      </Card>

      {/* Usage by Endpoint */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-sm font-semibold text-ink mb-4">Usage by Endpoint</h2>
          <Table
            columns={[
              { key: 'endpoint', header: 'Endpoint', className: 'font-mono text-xs' },
              { key: 'calls', header: 'Calls', className: 'font-mono text-xs', },
              { key: 'p50', header: 'p50', className: 'font-mono text-xs' },
              { key: 'errors', header: 'Errors', className: 'font-mono text-xs' },
            ]}
            data={usageByEndpoint as unknown as Record<string, unknown>[]}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink mb-4">Quick Start</h2>
          <CodeBlock
            code={`curl -X POST https://api.opsmcp.dev/v1/simplex/solve \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"objective": "max", "objective_coefficients": [3,2], "constraints": [{"coefficients": [1,1], "operator": "<=", "rhs": 4}]}'`}
            language="bash"
          />
        </Card>
      </div>

      {/* Request Logs */}
      <Card>
        <h2 className="text-sm font-semibold text-ink mb-4">Recent Requests</h2>
        <Table
          columns={[
            { key: 'timestamp', header: 'Timestamp', className: 'font-mono text-xs text-ink-tertiary' },
            {
              key: 'method',
              header: 'Method',
              render: (val) => (
                <span className={`font-mono text-xs font-medium ${val === 'POST' ? 'text-accent' : 'text-success'}`}>
                  {val as string}
                </span>
              ),
            },
            { key: 'endpoint', header: 'Endpoint', className: 'font-mono text-xs' },
            {
              key: 'status',
              header: 'Status',
              render: (val) => (
                <span className={`font-mono text-xs ${val === 200 ? 'text-success' : 'text-error'}`}>
                  {val as number}
                </span>
              ),
            },
            { key: 'latency', header: 'Latency', className: 'font-mono text-xs text-ink-muted' },
            { key: 'key', header: 'Key', className: 'font-mono text-xs text-ink-tertiary' },
          ]}
          data={requestLogs as unknown as Record<string, unknown>[]}
        />
      </Card>
    </div>
  )
}
