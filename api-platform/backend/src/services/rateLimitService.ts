import { getKeyUsage, resetKeyUsage, incrementKeyUsage } from '../models/keyUsageModel.js';

function getMidnightInTimezone(date: Date, timezone: string) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  local.setHours(0, 0, 0, 0);
  return local;
}

interface KeyUsageData {
  daily_count: number;
  daily_limit: number;
  last_reset: Date | null;
}

export async function checkAndIncrement(keyId: string, timezone = 'UTC') {
  let usage = await getKeyUsage(keyId) as KeyUsageData | null;
  if (!usage) return { allowed: true, dailyCount: 0, dailyLimit: 2 };

  const now = new Date();
  const userMidnight = getMidnightInTimezone(now, timezone);
  const lastReset = usage.last_reset
    ? getMidnightInTimezone(usage.last_reset, timezone)
    : new Date(0);

  if (userMidnight > lastReset) {
    await resetKeyUsage(keyId);
    usage = await getKeyUsage(keyId) as KeyUsageData | null;
  }

  if (usage && usage.daily_count >= usage.daily_limit) {
    const tomorrow = new Date(userMidnight);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      allowed: false,
      dailyCount: usage.daily_count,
      dailyLimit: usage.daily_limit,
      resetsAt: tomorrow.toISOString(),
    };
  }

  await incrementKeyUsage(keyId);
  return {
    allowed: true,
    dailyCount: (usage?.daily_count ?? 0) + 1,
    dailyLimit: usage?.daily_limit ?? 2,
  };
}

export async function getUsageStatus(keyId: string) {
  const usage = await getKeyUsage(keyId) as KeyUsageData & { total_requests: number } | null;
  if (!usage) return { dailyCount: 0, dailyLimit: 2, totalRequests: 0 };
  return {
    dailyCount: usage.daily_count,
    dailyLimit: usage.daily_limit,
    lastReset: usage.last_reset,
    totalRequests: usage.total_requests,
  };
}
