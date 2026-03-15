import IORedis from 'ioredis';

export const redis = new IORedis(process.env.REDIS_URL || 'redis://:redispass@localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export const CACHE_TTL = {
  PRICE:        3,
  QUOTE:        5,
  OHLCV:        60,
  COMPANY:      86400,
  PORTFOLIO:    10,
  LEADERBOARD:  60,
  MARKET_STATUS: 60,
} as const;

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function delCache(key: string): Promise<void> {
  await redis.del(key);
}
