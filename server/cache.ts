/**
 * Lightweight in-memory TTL cache for server-side responses.
 * Eliminates repeated DB hits on frequently-read, rarely-changed data.
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

/** Get a cached value, or undefined if missing / expired. */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/** Store a value with a TTL in seconds (default 300 = 5 min). */
export function cacheSet(key: string, value: unknown, ttlSeconds = 300): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Invalidate one or more cache keys by exact name or prefix. */
export function cacheInvalidate(...patterns: string[]): void {
  for (const pattern of patterns) {
    for (const key of store.keys()) {
      if (key === pattern || key.startsWith(pattern)) {
        store.delete(key);
      }
    }
  }
}

/**
 * Express middleware factory. Caches the JSON response of a GET route.
 * Usage: app.get("/api/foo", cacheMw("foo", 300), handler)
 */
export function cacheMw(key: string, ttlSeconds = 300) {
  return (req: any, res: any, next: any) => {
    // Include query string in cache key so different filters get separate entries
    const fullKey = req.originalUrl ? `${key}:${req.originalUrl}` : key;
    const cached = cacheGet(fullKey);
    if (cached !== undefined) {
      res.setHeader("X-Cache", "HIT");
      // Also set browser cache for public, non-auth endpoints
      res.setHeader("Cache-Control", `public, max-age=${Math.min(ttlSeconds, 60)}, stale-while-revalidate=${ttlSeconds}`);
      return res.json(cached);
    }

    // Intercept res.json to store the response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        cacheSet(fullKey, body, ttlSeconds);
        res.setHeader("X-Cache", "MISS");
        res.setHeader("Cache-Control", `public, max-age=${Math.min(ttlSeconds, 60)}, stale-while-revalidate=${ttlSeconds}`);
      }
      return originalJson(body);
    };

    next();
  };
}
