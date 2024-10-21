import Redis from "ioredis";
import { env } from "@/env.js";

export const redis = new Redis({ host: env.REDIS_URL });
