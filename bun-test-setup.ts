import { beforeAll, afterAll } from "bun:test";
import { redis } from "@/server/cache/redis";

beforeAll(async () => await redis.flushall());

afterAll(async () => await redis.quit());
