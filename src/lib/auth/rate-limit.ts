const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStatus = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const loginAttempts = new Map<string, RateLimitEntry>();

function getRateLimitKey(ipAddress: string) {
  return ipAddress.trim() || "unknown";
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of loginAttempts.entries()) {
    if (entry.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

function getRetryAfterSeconds(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function getLoginRateLimitStatus(ipAddress: string): RateLimitStatus {
  const now = Date.now();

  pruneExpiredEntries(now);

  const entry = loginAttempts.get(getRateLimitKey(ipAddress));

  if (!entry) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(entry.resetAt, now),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function registerFailedLoginAttempt(ipAddress: string): RateLimitStatus {
  const now = Date.now();
  const key = getRateLimitKey(ipAddress);

  pruneExpiredEntries(now);

  const currentEntry = loginAttempts.get(key);

  if (!currentEntry || currentEntry.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + LOGIN_WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  const nextEntry = {
    count: currentEntry.count + 1,
    resetAt: currentEntry.resetAt,
  };

  loginAttempts.set(key, nextEntry);

  if (nextEntry.count >= LOGIN_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(nextEntry.resetAt, now),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function clearLoginRateLimit(ipAddress: string) {
  loginAttempts.delete(getRateLimitKey(ipAddress));
}
