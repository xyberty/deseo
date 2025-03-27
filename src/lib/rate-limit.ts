interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastReset: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (res: any, limit: number, token: string) =>
      new Promise((resolve, reject) => {
        const now = Date.now();
        const windowStart = now - options.interval;

        // Initialize or get existing token data
        if (!store[token]) {
          store[token] = {
            tokens: limit,
            lastReset: now,
          };
        }

        // Reset if window has passed
        if (now - store[token].lastReset >= options.interval) {
          store[token] = {
            tokens: limit,
            lastReset: now,
          };
        }

        // Check if limit exceeded
        if (store[token].tokens <= 0) {
          reject(new Error("Rate limit exceeded"));
          return;
        }

        // Decrement tokens
        store[token].tokens--;

        // Set rate limit headers
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", store[token].tokens);
        res.setHeader(
          "X-RateLimit-Reset",
          store[token].lastReset + options.interval
        );

        resolve(true);
      }),
  };
} 