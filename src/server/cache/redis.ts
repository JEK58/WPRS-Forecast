import Redis from "ioredis";
import { env } from "@/env.js";

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    })
  : null;

if (redis) {
  redis.on("connect", () => {
    console.log("Redis connection established");
  });

  redis.on("end", () => {
    console.log("Redis connection closed");
  });

  redis.on("error", (error) => {
    console.error("Redis error", error);
  });
}
