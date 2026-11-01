import "server-only";
import { Redis } from "ioredis";

// Admin sessions and login throttling live in Redis (REDIS_URL), next to the job queues.
const globalForRedis = globalThis as unknown as { adminRedis?: Redis };

export function redis(): Redis {
  if (!globalForRedis.adminRedis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL must be set for the admin");
    globalForRedis.adminRedis = new Redis(url, { maxRetriesPerRequest: 3 });
  }
  return globalForRedis.adminRedis;
}

export function redisConnection() {
  const u = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,
  };
}
