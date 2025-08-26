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
    check: (limit: number, token: string) =>
      new Promise((resolve, reject) => {
        const now = Date.now();

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

        resolve(true);
      }),
  };
} 