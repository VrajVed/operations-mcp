const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function apiFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Timezone': timezone,
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => null)

  if (res.status === 402) {
    throw new PaymentRequiredError(data?.error || 'Subscription required', data?.checkoutUrl)
  }

  if (res.status === 429) {
    throw new RateLimitError(data?.error || 'Rate limit exceeded', data?.resetsAt)
  }

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`)
  }

  return data
}

export class PaymentRequiredError extends Error {
  checkoutUrl?: string
  constructor(message: string, checkoutUrl?: string) {
    super(message)
    this.name = 'PaymentRequiredError'
    this.checkoutUrl = checkoutUrl
  }
}

export class RateLimitError extends Error {
  resetsAt?: string
  constructor(message: string, resetsAt?: string) {
    super(message)
    this.name = 'RateLimitError'
    this.resetsAt = resetsAt
  }
}
