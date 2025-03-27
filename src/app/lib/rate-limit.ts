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
    check: async (limit: number, token: string) => {
      const now = Date.now();
      const key = `${token}:${limit}`;

      if (!store[key]) {
        store[key] = {
          tokens: limit,
          lastReset: now,
        };
        return;
      }

      const timePassed = now - store[key].lastReset;
      if (timePassed >= options.interval) {
        store[key] = {
          tokens: limit,
          lastReset: now,
        };
        return;
      }

      if (store[key].tokens <= 0) {
        throw new Error('Rate limit exceeded');
      }

      store[key].tokens--;
    },
  };
} 