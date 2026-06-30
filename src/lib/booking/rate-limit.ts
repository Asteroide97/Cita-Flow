const PUBLIC_BOOKING_WINDOW_MS = 15 * 60 * 1000;
const PUBLIC_BOOKING_MAX_ATTEMPTS = 4;

type PublicBookingRateLimitEntry = {
  count: number;
  resetAt: number;
};

type PublicBookingRateLimitStatus = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const publicBookingAttempts = new Map<string, PublicBookingRateLimitEntry>();

function getBookingAttemptKey(ipAddress: string, phoneKey: string) {
  const normalizedIp = ipAddress.trim() || "unknown";
  const normalizedPhone = phoneKey.trim() || "unknown";

  return `${normalizedIp}::${normalizedPhone}`;
}

function pruneExpiredBookingEntries(now: number) {
  for (const [key, entry] of publicBookingAttempts.entries()) {
    if (entry.resetAt <= now) {
      publicBookingAttempts.delete(key);
    }
  }
}

function getRetryAfterSeconds(resetAt: number, now: number) {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function getPublicBookingRateLimitStatus(
  ipAddress: string,
  phoneKey: string,
): PublicBookingRateLimitStatus {
  const now = Date.now();

  pruneExpiredBookingEntries(now);

  const entry = publicBookingAttempts.get(getBookingAttemptKey(ipAddress, phoneKey));

  if (!entry) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= PUBLIC_BOOKING_MAX_ATTEMPTS) {
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

export function registerPublicBookingAttempt(
  ipAddress: string,
  phoneKey: string,
) {
  const now = Date.now();
  const key = getBookingAttemptKey(ipAddress, phoneKey);

  pruneExpiredBookingEntries(now);

  const currentEntry = publicBookingAttempts.get(key);

  if (!currentEntry || currentEntry.resetAt <= now) {
    publicBookingAttempts.set(key, {
      count: 1,
      resetAt: now + PUBLIC_BOOKING_WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    } satisfies PublicBookingRateLimitStatus;
  }

  const nextEntry = {
    count: currentEntry.count + 1,
    resetAt: currentEntry.resetAt,
  };

  publicBookingAttempts.set(key, nextEntry);

  if (nextEntry.count >= PUBLIC_BOOKING_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(nextEntry.resetAt, now),
    } satisfies PublicBookingRateLimitStatus;
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  } satisfies PublicBookingRateLimitStatus;
}

export function clearPublicBookingRateLimit(ipAddress: string, phoneKey: string) {
  publicBookingAttempts.delete(getBookingAttemptKey(ipAddress, phoneKey));
}
