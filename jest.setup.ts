import Redis from "ioredis";
import { env } from "@/env.mjs";

const redis = new Redis({ host: env.REDIS_URL });

// Use test database url
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

beforeAll(async () => await redis.flushall());

afterAll(async () => await redis.quit());
