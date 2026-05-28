export interface User {
  clerk_id: string;
  email: string;
  subscription_status: string;
  razorpay_subscription_id: string | null;
  timezone: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  hashed_key: string;
  mask: string;
  is_free: boolean;
  status: string;
  created_at: string;
}

export interface KeyUsage {
  key_id: string;
  daily_count: number;
  daily_limit: number;
  last_reset: string;
  total_requests: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_plan_id: string;
  status: string;
  current_period_start: number | null;
  current_period_end: number | null;
  short_url: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string | null;
}

export interface RequestLog {
  id: number;
  key_id: string | null;
  endpoint: string;
  method: string;
  status_code: number | null;
  latency_ms: number | null;
  created_at: string;
}

declare global {
  namespace Express {
    interface Request {
      keyRecord?: ApiKey;
      auth?: { userId: string };
    }
  }
}


