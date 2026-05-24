const { getKeyUsage, resetKeyUsage, incrementKeyUsage } = require('../db/queries');

function getMidnightInTimezone(date, timezone) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  local.setHours(0, 0, 0, 0);
  return local;
}

async function checkAndIncrement(keyId, timezone = 'UTC') {
  let usage = await getKeyUsage(keyId);
  if (!usage) return { allowed: true, dailyCount: 0, dailyLimit: 2 };

  const now = new Date();
  const userMidnight = getMidnightInTimezone(now, timezone);
  const lastReset = getMidnightInTimezone(new Date(usage.last_reset), timezone);

  if (userMidnight > lastReset) {
    await resetKeyUsage(keyId);
    usage = await getKeyUsage(keyId);
  }

  if (usage.daily_count >= usage.daily_limit) {
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
    dailyCount: usage.daily_count + 1,
    dailyLimit: usage.daily_limit,
  };
}

async function getUsageStatus(keyId) {
  const usage = await getKeyUsage(keyId);
  if (!usage) return { dailyCount: 0, dailyLimit: 2, totalRequests: 0 };
  return {
    dailyCount: usage.daily_count,
    dailyLimit: usage.daily_limit,
    lastReset: usage.last_reset,
    totalRequests: usage.total_requests,
  };
}

module.exports = { checkAndIncrement, getUsageStatus };
