import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { ranking } from "@/server/db/schema";
import * as Sentry from "@sentry/nextjs";
import { redis } from "@/server/cache/redis";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKey } = req.query;

  if (!apiKey || apiKey !== env.API_KEY) {
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

  const res = await db.select().from(ranking);

  const keyValuePairs = res.map((item) => [
    "name:" + item.name.toLocaleLowerCase(),
    item.id,
  ]);

  await redis.mset(...keyValuePairs.flat());
}

export default handler;
