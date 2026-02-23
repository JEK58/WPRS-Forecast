import { afterAll, afterEach, beforeAll } from "bun:test";
import { redis } from "@/server/cache/redis";

async function flushRedisCache() {
  if (!redis) return;
  await redis.flushall().catch(() => undefined);
}

beforeAll(async () => {
  await flushRedisCache();
});

afterEach(async () => {
  await flushRedisCache();
});

afterAll(async () => {
  if (!redis) return;
  await redis.quit().catch(() => undefined);
});
