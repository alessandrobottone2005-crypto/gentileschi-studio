export function dailyLimit(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
export function aiLimits() {
  return {
    userLimit: dailyLimit(process.env.AI_USER_DAILY_LIMIT, 20),
    globalLimit: dailyLimit(process.env.AI_GLOBAL_DAILY_LIMIT, 500),
  };
}
export function quotaDay(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const reset = new Date(`${day}T00:00:00.000Z`);
  reset.setUTCDate(reset.getUTCDate() + 1);
  return { day, resetsAt: reset.toISOString() };
}
export function quotaSummary(
  used: number,
  globalUsed: number,
  userLimit: number,
  globalLimit: number,
) {
  const remaining = Math.max(0, userLimit - used);
  return {
    used,
    limit: userLimit,
    remaining,
    available: Math.min(remaining, Math.max(0, globalLimit - globalUsed)),
  };
}
