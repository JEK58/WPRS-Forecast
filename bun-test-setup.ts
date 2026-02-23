import { beforeAll, afterAll } from "bun:test";
import { redis } from "@/server/cache/redis";

beforeAll(async () => {
  if (!redis) return;
  await redis.flushall().catch(() => undefined);
});

afterAll(async () => {
  if (!redis) return;
  await redis.quit().catch(() => undefined);
});
