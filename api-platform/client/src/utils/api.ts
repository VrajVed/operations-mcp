const API_BASE = import.meta.env.VITE_API_URL || ''

export async function apiFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const url = `${API_BASE}${endpoint}`

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Timezone': timezone,
      ...options.headers,
    },
  }).catch((err) => {
    console.error(`[apiFetch] Network error for ${url}:`, err)
    throw new Error(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`)
  })

  const data = await res.json().catch(() => null)

  console.log(`[apiFetch] ${options.method || 'GET'} ${url} -> ${res.status}`, data)

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
