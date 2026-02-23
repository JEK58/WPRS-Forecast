import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import * as Sentry from "@sentry/nextjs";
import { redis } from "@/server/cache/redis";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKeyQuery = req.query.apiKey;
  const apiKey = Array.isArray(apiKeyQuery) ? apiKeyQuery[0] : apiKeyQuery;

  if (typeof apiKey !== "string" || apiKey.trim() !== env.API_KEY) {
    console.info("Attempted to populate cache with invalid API key");
    return res.status(401).json({ message: "Invalid API key" });
  }

  console.info("🥖 Populating cache...");
  try {
    await populateCache();
    console.info("🧹 ...done");
    res.status(200).send("done");
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    res.status(500).json({ message: "Internal error" });
  }
}

async function populateCache() {
  if (!redis) {
    console.info("Redis is not configured, skipping cache population");
    return;
  }

  await ensureRedisReady();

  const res = await db.select().from(ranking);

  const keyValuePairs = res.map((item) => [
    "name:" + item.name.toLocaleLowerCase(),
    item.id,
  ]);

  await redis.mset(...keyValuePairs.flat());
}

async function ensureRedisReady() {
  if (!redis) return;

  try {
    await redis.ping();
    return;
  } catch {
    // Connection is not ready yet. Continue with connect/wait flow.
  }

  try {
    await redis.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const alreadyConnectingOrConnected =
      message.includes("already connecting") ||
      message.includes("already connected");

    if (!alreadyConnectingOrConnected) throw error;
  }

  const maxAttempts = 25;
  const delayInMs = 200;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await redis.ping();
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(
          `Timed out waiting for Redis connection after ${maxAttempts * delayInMs
          }ms`,
          { cause: error },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
    }
  }
}

export default handler;
