import Redis from "ioredis";
import { env } from "@/env.js";

export const redis = new Redis({ host: env.REDIS_URL });

redis.on("connect", () => {
  console.log("Redis connection established");
});

redis.on("end", () => {
  console.log("Redis connection closed");
});
