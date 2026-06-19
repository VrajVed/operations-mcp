import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Key, Copy, Eye, EyeOff, RefreshCw, Activity, BarChart3, Terminal, AlertTriangle } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Table from '../components/Table'
import { Input } from '../components/Input'
import CodeBlock from '../components/CodeBlock'
import { apiFetch, PaymentRequiredError } from '../utils/api'

interface ApiKey {
  id: string
  name: string
  mask: string
  status: string
  isFree: boolean
  dailyCount: number
  dailyLimit: number
  lastReset: string
  createdAt: string
}

interface SubscriptionStatus {
  status: string
  plan: string | null
  currentPeriodEnd: string | null
  checkoutUrl: string | null
}

export default function Dashboard() {
  const { getToken, isSignedIn } = useAuth()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [newKeyName, setNewKeyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [rawKeys, setRawKeys] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isSignedIn) return
    loadData()
  }, [isSignedIn])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      const [keysData, subData] = await Promise.all([
        apiFetch('/v1/keys', token),
        apiFetch('/v1/subscriptions/status', token),
      ])
      setKeys(keysData)
      setSubscription(subData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      const message = err instanceof Error ? err.message : 'Failed to load data. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return
    try {
      setCreating(true)
      setError(null)
      setCheckoutUrl(null)
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      const data = await apiFetch('/v1/keys', token, {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName }),
      })
      setRawKeys(prev => ({ ...prev, [data.id]: data.key }))
      setKeys(prev => [...prev, {
        id: data.id,
        name: data.name,
        mask: data.mask,
        status: 'active',
        isFree: data.isFree ?? false,
        dailyCount: data.dailyCount ?? 0,
        dailyLimit: data.dailyLimit ?? (data.isFree ? 2 : 999999),
        lastReset: new Date().toISOString(),
        createdAt: data.createdAt,
      }])
      setNewKeyName('')
    } catch (err) {
      if (err instanceof PaymentRequiredError) {
        setCheckoutUrl(err.checkoutUrl || null)
        setError(err.message)
      } else {
        console.error('Create key error:', err)
        setError(err instanceof Error ? err.message : 'Failed to create key')
      }
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(keyId: string) {
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await apiFetch(`/v1/keys/${keyId}`, token, { method: 'DELETE' })
      setKeys(prev => prev.filter(k => k.id !== keyId))
    } catch (err) {
      console.error('Revoke key error:', err)
      setError('Failed to revoke key')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  const activeKeys = keys.filter(k => k.status === 'active')
  const freeKey = keys.find(k => k.isFree)

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Key size={24} className="text-accent" />
        <div>
          <h1 className="text-[28px] font-semibold text-ink leading-tight -tracking-[0.02em]">API Dashboard</h1>
          <p className="text-sm text-ink-muted">Manage keys, monitor usage, track subscription</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <Activity size={14} />
            Active Keys
          </div>
          <p className="text-xl font-semibold text-ink font-mono">{activeKeys.length}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <Key size={14} />
            Subscription
          </div>
          <p className="text-xl font-semibold text-ink font-mono">
            {subscription?.status === 'active' ? 'Active' : 'Inactive'}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <BarChart3 size={14} />
            Free Uses Today
          </div>
          <p className="text-xl font-semibold text-ink font-mono">
            {freeKey ? `${freeKey.dailyCount}/${freeKey.dailyLimit}` : '0/2'}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink-tertiary mb-1">
            <Terminal size={14} />
            Plan
          </div>
          <p className="text-xl font-semibold text-ink font-mono">
            {subscription?.plan?.replace('plan_', '').replace('_monthly', '') || 'Free'}
          </p>
        </Card>
      </div>

      {/* Error / Checkout */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-soft border border-error/30">
          <div className="flex items-center gap-2 text-error mb-2">
            <AlertTriangle size={16} />
            <span className="font-medium">{error}</span>
          </div>
          {checkoutUrl && (
            <a 
              href={checkoutUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover underline text-sm"
            >
              Complete payment to create more keys →
            </a>
          )}
        </div>
      )}

      {/* API Keys */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">API Keys</h2>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" size="sm" onClick={createKey} disabled={creating}>
              <Key size={14} />
              Create Key
            </Button>
          </div>
        </div>
        <Table
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'mask', header: 'Key', className: 'font-mono text-xs' },
            {
              key: 'isFree',
              header: 'Type',
              render: (val: unknown) => (
                <Badge variant={val ? 'warning' : 'success'}>
                  {val ? 'Free' : 'Paid'}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (val: unknown) => (
                <Badge variant={val === 'active' ? 'success' : 'error'}>{val as string}</Badge>
              ),
            },
            {
              key: 'dailyCount',
              header: 'Usage',
              render: (_val: unknown, row: Record<string, unknown>) => {
                const key = row as unknown as ApiKey
                return key.isFree ? (
                  <span className="font-mono text-xs text-ink-muted">
                    {key.dailyCount}/{key.dailyLimit}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-success">Unlimited</span>
                )
              },
            },
            {
              key: 'id',
              header: '',
              render: (_val: unknown, row: Record<string, unknown>) => {
                const key = row as unknown as ApiKey
                return (
                  <div className="flex gap-1">
                    {rawKeys[key.id] && (
                      <>
                        <button
                          onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                          className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                          aria-label="Toggle key visibility"
                        >
                          {showKey[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(rawKeys[key.id])}
                          className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                          aria-label="Copy key"
                        >
                          <Copy size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="p-1.5 rounded-md text-ink-muted hover:text-error hover:bg-error-soft transition-colors cursor-pointer"
                      aria-label="Revoke key"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                )
              },
            },
          ]}
          data={keys as unknown as Record<string, unknown>[]}
        />
        {showKey && Object.keys(rawKeys).some(id => showKey[id]) && (
          <div className="mt-4 p-4 rounded-lg bg-surface-2 border border-hairline">
            <p className="text-xs text-ink-tertiary mb-2">Raw API Keys (copy now — shown only once)</p>
            {Object.entries(rawKeys).map(([id, key]) => (
              showKey[id] && (
                <CodeBlock key={id} code={key} language="bash" className="mb-2" />
              )
            ))}
          </div>
        )}
      </Card>

      {/* Quick Start */}
      <Card>
        <h2 className="text-sm font-semibold text-ink mb-4">Quick Start</h2>
        <CodeBlock
          code={`curl -X GET http://localhost:8080/api \\\n  -H "x-api-key: opsmcp-..." \\\n  -H "X-Timezone: Asia/Kolkata"`}
          language="bash"
        />
      </Card>
    </div>
  )
}
