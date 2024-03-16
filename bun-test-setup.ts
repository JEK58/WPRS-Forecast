import { beforeAll, afterAll } from "bun:test";

import Redis from "ioredis";
import { env } from "@/env.js";

const redis = new Redis({ host: env.REDIS_URL });

beforeAll(async () => await redis.flushall());

afterAll(async () => await redis.quit());
